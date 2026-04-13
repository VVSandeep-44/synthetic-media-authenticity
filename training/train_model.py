from __future__ import annotations

import argparse
import json
import math
import random
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from torch import nn
from torch.cuda.amp import GradScaler, autocast
from torch.utils.data import DataLoader, Subset, WeightedRandomSampler
from torchvision import datasets, transforms

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.ml.model_def import HybridCNNViT

ARTIFACTS_DIR = REPO_ROOT / 'artifacts'
DEFAULT_DATA_ROOT = REPO_ROOT / 'dataset'


@dataclass
class TrainConfig:
    data_root: Path = DEFAULT_DATA_ROOT
    output_dir: Path = ARTIFACTS_DIR
    input_size: int = 224
    batch_size: int = 8
    epochs: int = 20
    warmup_epochs: int = 3
    val_ratio: float = 0.2
    seed: int = 42
    num_workers: int = 0
    learning_rate_head: float = 1e-4
    learning_rate_backbone: float = 1e-5
    weight_decay: float = 1e-4
    label_smoothing: float = 0.05
    dropout: float = 0.35
    grad_clip_norm: float = 1.0
    patience: int = 5
    imbalance_strategy: str = 'sampler'
    scheduler_min_lr_ratio: float = 0.1
    finetune_warmup_epochs: int = 1
    enable_temperature_scaling: bool = True


def parse_args() -> TrainConfig:
    parser = argparse.ArgumentParser(description='Train the synthetic media authenticity model.')
    parser.add_argument('--data-root', type=Path, default=DEFAULT_DATA_ROOT, help='Dataset root directory.')
    parser.add_argument('--output-dir', type=Path, default=ARTIFACTS_DIR, help='Directory to write checkpoints.')
    parser.add_argument('--input-size', type=int, default=224)
    parser.add_argument('--batch-size', type=int, default=8)
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--warmup-epochs', type=int, default=3)
    parser.add_argument('--val-ratio', type=float, default=0.2)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--num-workers', type=int, default=0)
    parser.add_argument('--learning-rate-head', type=float, default=1e-4)
    parser.add_argument('--learning-rate-backbone', type=float, default=1e-5)
    parser.add_argument('--weight-decay', type=float, default=1e-4)
    parser.add_argument('--label-smoothing', type=float, default=0.05)
    parser.add_argument('--dropout', type=float, default=0.35)
    parser.add_argument('--grad-clip-norm', type=float, default=1.0)
    parser.add_argument('--patience', type=int, default=5)
    parser.add_argument(
        '--imbalance-strategy',
        type=str,
        default='sampler',
        choices=['sampler', 'class_weights', 'both', 'none'],
        help='Class-imbalance strategy: sampler, class_weights, both, or none.'
    )
    parser.add_argument('--scheduler-min-lr-ratio', type=float, default=0.1)
    parser.add_argument('--finetune-warmup-epochs', type=int, default=1)
    parser.add_argument('--disable-temperature-scaling', action='store_true')
    args = parser.parse_args()
    return TrainConfig(
        data_root=args.data_root,
        output_dir=args.output_dir,
        input_size=args.input_size,
        batch_size=args.batch_size,
        epochs=args.epochs,
        warmup_epochs=args.warmup_epochs,
        val_ratio=args.val_ratio,
        seed=args.seed,
        num_workers=args.num_workers,
        learning_rate_head=args.learning_rate_head,
        learning_rate_backbone=args.learning_rate_backbone,
        weight_decay=args.weight_decay,
        label_smoothing=args.label_smoothing,
        dropout=args.dropout,
        grad_clip_norm=args.grad_clip_norm,
        patience=args.patience,
        imbalance_strategy=args.imbalance_strategy,
        scheduler_min_lr_ratio=args.scheduler_min_lr_ratio,
        finetune_warmup_epochs=args.finetune_warmup_epochs,
        enable_temperature_scaling=not args.disable_temperature_scaling,
    )


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def build_train_transforms(input_size: int) -> transforms.Compose:
    return transforms.Compose([
        transforms.RandomResizedCrop(input_size, scale=(0.75, 1.0), ratio=(0.9, 1.1)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomApply([
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15, hue=0.04)
        ], p=0.6),
        transforms.RandomAutocontrast(p=0.3),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.08), ratio=(0.3, 3.3)),
    ])


def build_eval_transforms(input_size: int) -> transforms.Compose:
    return transforms.Compose([
        transforms.Resize((input_size, input_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])


def find_imagefolder_root(data_root: Path) -> Path:
    if (data_root / 'train').exists():
        return data_root / 'train'
    return data_root


def _looks_like_imagefolder_root(path: Path) -> bool:
    if not path.exists() or not path.is_dir():
        return False

    class_dirs = [entry for entry in path.iterdir() if entry.is_dir() and not entry.name.startswith('.')]
    if len(class_dirs) < 2:
        return False

    image_suffixes = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    for class_dir in class_dirs:
        for file in class_dir.rglob('*'):
            if file.is_file() and file.suffix.lower() in image_suffixes:
                return True
    return False


def resolve_data_root(configured_root: Path) -> tuple[Path, list[Path]]:
    candidates = [
        configured_root,
        configured_root / 'train',
        REPO_ROOT / 'dataset',
        REPO_ROOT / 'dataset' / 'train',
        REPO_ROOT / 'data',
        REPO_ROOT / 'data' / 'train',
        REPO_ROOT / 'datasets',
        REPO_ROOT / 'datasets' / 'train',
        REPO_ROOT / 'training' / 'dataset',
        REPO_ROOT / 'training' / 'dataset' / 'train',
    ]

    seen: set[Path] = set()
    unique_candidates: list[Path] = []
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved not in seen:
            seen.add(resolved)
            unique_candidates.append(resolved)

    for candidate in unique_candidates:
        if _looks_like_imagefolder_root(candidate):
            return candidate, unique_candidates

    return find_imagefolder_root(configured_root), unique_candidates


def stratified_split(targets: Iterable[int], val_ratio: float, seed: int) -> tuple[list[int], list[int]]:
    class_to_indices: dict[int, list[int]] = {}
    for index, target in enumerate(targets):
        class_to_indices.setdefault(int(target), []).append(index)

    rng = random.Random(seed)
    train_indices: list[int] = []
    val_indices: list[int] = []

    for indices in class_to_indices.values():
        rng.shuffle(indices)
        if len(indices) <= 1:
            train_indices.extend(indices)
            continue

        val_count = max(1, int(round(len(indices) * val_ratio)))
        val_count = min(val_count, len(indices) - 1)
        val_indices.extend(indices[:val_count])
        train_indices.extend(indices[val_count:])

    return train_indices, val_indices


def build_dataloaders(cfg: TrainConfig) -> tuple[DataLoader, DataLoader, list[str], list[int]]:
    dataset_root, searched_candidates = resolve_data_root(cfg.data_root)
    if not dataset_root.exists() or not _looks_like_imagefolder_root(dataset_root):
        searched = '\n'.join(f'  - {candidate}' for candidate in searched_candidates)
        raise FileNotFoundError(
            'Dataset root not found or invalid for ImageFolder.\n'
            f'Searched locations:\n{searched}\n'
            'Expected structure example:\n'
            '  <data-root>/train/Authentic/*.jpg\n'
            '  <data-root>/train/Synthetic/*.jpg\n'
            'Or directly:\n'
            '  <data-root>/Authentic/*.jpg\n'
            '  <data-root>/Synthetic/*.jpg\n\n'
            'Run with explicit path if your dataset is elsewhere:\n'
            '  python train_model.py --data-root "D:/path/to/dataset"'
        )

    train_transform = build_train_transforms(cfg.input_size)
    eval_transform = build_eval_transforms(cfg.input_size)

    train_source = datasets.ImageFolder(dataset_root, transform=train_transform)
    if len(train_source.samples) == 0:
        raise ValueError(f'No images found under {dataset_root}.')

    class_names = [str(name) for name in train_source.classes]

    train_dir = cfg.data_root / 'train'
    val_dir = cfg.data_root / 'val'
    if train_dir.exists() and val_dir.exists():
        train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
        val_dataset = datasets.ImageFolder(val_dir, transform=eval_transform)
    else:
        train_indices, val_indices = stratified_split(train_source.targets, cfg.val_ratio, cfg.seed)
        train_dataset = Subset(train_source, train_indices)
        eval_source = datasets.ImageFolder(dataset_root, transform=eval_transform)
        val_dataset = Subset(eval_source, val_indices)

    train_targets = _subset_targets(train_dataset, train_source)
    sampler = None
    if cfg.imbalance_strategy in {'sampler', 'both'}:
        class_weights = _class_weights(train_targets, len(class_names))
        sample_weights = [class_weights[target] for target in train_targets]
        sampler = WeightedRandomSampler(sample_weights, num_samples=len(sample_weights), replacement=True)

    train_loader = DataLoader(
        train_dataset,
        batch_size=cfg.batch_size,
        sampler=sampler,
        shuffle=sampler is None,
        num_workers=cfg.num_workers,
        pin_memory=torch.cuda.is_available(),
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=cfg.batch_size,
        shuffle=False,
        num_workers=cfg.num_workers,
        pin_memory=torch.cuda.is_available(),
    )
    return train_loader, val_loader, class_names, train_targets


def _subset_targets(dataset, source: datasets.ImageFolder) -> list[int]:
    if isinstance(dataset, Subset):
        return [int(source.targets[index]) for index in dataset.indices]
    return [int(target) for target in dataset.targets]


def _class_weights(targets: list[int], num_classes: int) -> dict[int, float]:
    counts = np.bincount(np.asarray(targets, dtype=np.int64), minlength=num_classes).astype(np.float32)
    counts[counts == 0.0] = 1.0
    total = float(counts.sum())
    return {index: float(total / (num_classes * count)) for index, count in enumerate(counts)}


def build_model(num_classes: int, dropout: float, device: torch.device) -> HybridCNNViT:
    model = HybridCNNViT(num_classes=num_classes, input_size=224, dropout=dropout)
    model.to(device)
    return model


def set_trainable_parameters(model: HybridCNNViT, stage: str) -> None:
    if stage == 'warmup':
        for parameter in model.cnn.parameters():
            parameter.requires_grad = False
        for parameter in model.vit.parameters():
            parameter.requires_grad = False
        for parameter in model.classifier.parameters():
            parameter.requires_grad = True
        return

    for parameter in model.cnn.parameters():
        parameter.requires_grad = True
    for parameter in model.vit.parameters():
        parameter.requires_grad = True
    for parameter in model.classifier.parameters():
        parameter.requires_grad = True


def build_optimizer(model: HybridCNNViT, cfg: TrainConfig, stage: str) -> torch.optim.Optimizer:
    if stage == 'warmup':
        return torch.optim.AdamW(
            model.classifier.parameters(),
            lr=cfg.learning_rate_head,
            weight_decay=cfg.weight_decay,
        )

    return torch.optim.AdamW(
        [
            {'params': model.classifier.parameters(), 'lr': cfg.learning_rate_head},
            {'params': model.cnn.parameters(), 'lr': cfg.learning_rate_backbone},
            {'params': model.vit.parameters(), 'lr': cfg.learning_rate_backbone * 0.5},
        ],
        weight_decay=cfg.weight_decay,
    )


def build_stage_scheduler(
    optimizer: torch.optim.Optimizer,
    stage_epochs: int,
    warmup_epochs: int,
    min_lr_ratio: float,
) -> torch.optim.lr_scheduler.LambdaLR | None:
    if stage_epochs <= 0:
        return None

    warmup_epochs = max(0, min(warmup_epochs, stage_epochs - 1))
    min_lr_ratio = float(np.clip(min_lr_ratio, 0.01, 1.0))

    def lr_lambda(epoch_index: int) -> float:
        if warmup_epochs > 0 and epoch_index < warmup_epochs:
            return float((epoch_index + 1) / warmup_epochs)

        if stage_epochs - warmup_epochs <= 1:
            return 1.0

        progress = (epoch_index - warmup_epochs) / max(stage_epochs - warmup_epochs - 1, 1)
        cosine = 0.5 * (1.0 + math.cos(math.pi * progress))
        return float(min_lr_ratio + (1.0 - min_lr_ratio) * cosine)

    return torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda=lr_lambda)


def train_one_epoch(
    model: HybridCNNViT,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    scaler: GradScaler,
    grad_clip_norm: float,
) -> float:
    model.train()
    running_loss = 0.0
    num_batches = 0

    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)

        optimizer.zero_grad(set_to_none=True)
        with autocast(enabled=device.type == 'cuda'):
            logits = model(images)
            loss = criterion(logits, targets)

        scaler.scale(loss).backward()
        if grad_clip_norm > 0:
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip_norm)
        scaler.step(optimizer)
        scaler.update()

        running_loss += float(loss.item())
        num_batches += 1

    return running_loss / max(num_batches, 1)


@torch.no_grad()
def evaluate(model: HybridCNNViT, loader: DataLoader, device: torch.device) -> dict[str, float | list[int] | list[float]]:
    model.eval()
    targets_all: list[int] = []
    predictions_all: list[int] = []
    probabilities_all: list[float] = []

    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)
        logits = model(images)
        probabilities = torch.softmax(logits, dim=1)
        predictions = probabilities.argmax(dim=1)

        targets_all.extend(targets.cpu().tolist())
        predictions_all.extend(predictions.cpu().tolist())
        if probabilities.shape[1] > 1:
            probabilities_all.extend(probabilities[:, 1].cpu().tolist())
        else:
            probabilities_all.extend(probabilities[:, 0].cpu().tolist())

    return compute_metrics(targets_all, predictions_all, probabilities_all)


def compute_metrics(y_true: list[int], y_pred: list[int], y_prob: list[float]) -> dict[str, float | list[int] | list[float]]:
    y_true_array = np.asarray(y_true, dtype=np.int64)
    y_pred_array = np.asarray(y_pred, dtype=np.int64)
    y_prob_array = np.asarray(y_prob, dtype=np.float32)

    accuracy = float((y_true_array == y_pred_array).mean()) if y_true_array.size else 0.0
    num_classes = int(max(y_true_array.max(initial=0), y_pred_array.max(initial=0)) + 1)

    per_class_precision: list[float] = []
    per_class_recall: list[float] = []
    per_class_f1: list[float] = []

    for class_index in range(num_classes):
        tp = float(np.sum((y_true_array == class_index) & (y_pred_array == class_index)))
        fp = float(np.sum((y_true_array != class_index) & (y_pred_array == class_index)))
        fn = float(np.sum((y_true_array == class_index) & (y_pred_array != class_index)))

        precision = tp / (tp + fp + 1e-8)
        recall = tp / (tp + fn + 1e-8)
        f1 = 2.0 * precision * recall / (precision + recall + 1e-8)

        per_class_precision.append(float(precision))
        per_class_recall.append(float(recall))
        per_class_f1.append(float(f1))

    macro_precision = float(np.mean(per_class_precision)) if per_class_precision else 0.0
    macro_recall = float(np.mean(per_class_recall)) if per_class_recall else 0.0
    macro_f1 = float(np.mean(per_class_f1)) if per_class_f1 else 0.0

    return {
        'accuracy': accuracy,
        'macro_precision': macro_precision,
        'macro_recall': macro_recall,
        'macro_f1': macro_f1,
        'per_class_precision': per_class_precision,
        'per_class_recall': per_class_recall,
        'per_class_f1': per_class_f1,
        'probabilities': y_prob_array.tolist(),
        'targets': y_true_array.tolist(),
        'predictions': y_pred_array.tolist(),
    }


def tune_threshold(y_true: list[int], y_prob: list[float]) -> tuple[float, float]:
    if not y_true:
        return 0.5, 0.0

    y_true_array = np.asarray(y_true, dtype=np.int64)
    y_prob_array = np.asarray(y_prob, dtype=np.float32)
    best_threshold = 0.5
    best_f1 = -1.0

    for threshold in np.linspace(0.05, 0.95, 181):
        y_pred_array = (y_prob_array >= threshold).astype(np.int64)
        metrics = compute_metrics(y_true_array.tolist(), y_pred_array.tolist(), y_prob_array.tolist())
        macro_f1 = float(metrics['macro_f1'])
        if macro_f1 > best_f1:
            best_f1 = macro_f1
            best_threshold = float(threshold)

    return best_threshold, best_f1


@torch.no_grad()
def collect_logits_and_targets(model: HybridCNNViT, loader: DataLoader, device: torch.device) -> tuple[torch.Tensor, torch.Tensor]:
    model.eval()
    logits_all: list[torch.Tensor] = []
    targets_all: list[torch.Tensor] = []

    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        logits = model(images)
        logits_all.append(logits.detach().cpu())
        targets_all.append(targets.detach().cpu())

    if not logits_all:
        return torch.empty((0, 2)), torch.empty((0,), dtype=torch.long)

    return torch.cat(logits_all, dim=0), torch.cat(targets_all, dim=0)


def fit_temperature(logits: torch.Tensor, targets: torch.Tensor, device: torch.device) -> float:
    if logits.numel() == 0 or targets.numel() == 0:
        return 1.0

    logits_device = logits.to(device)
    targets_device = targets.to(device)
    temperature = nn.Parameter(torch.ones(1, device=device))
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.LBFGS([temperature], lr=0.1, max_iter=50, line_search_fn='strong_wolfe')

    def closure():
        optimizer.zero_grad(set_to_none=True)
        clamped = torch.clamp(temperature, 0.05, 10.0)
        loss = criterion(logits_device / clamped, targets_device)
        loss.backward()
        return loss

    optimizer.step(closure)
    return float(torch.clamp(temperature.detach(), 0.05, 10.0).item())


def save_artifacts(
    model: HybridCNNViT,
    class_names: list[str],
    cfg: TrainConfig,
    metrics: dict[str, float | list[int] | list[float]],
    threshold: float,
    temperature: float,
    calibration_metrics: dict[str, float] | None,
) -> None:
    cfg.output_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = cfg.output_dir / 'best_model.pth'
    torch.save(
        {
            'model_state_dict': model.state_dict(),
            'class_names': class_names,
            'input_size': cfg.input_size,
            'threshold': threshold,
            'temperature': temperature,
            'metrics': metrics,
            'calibration_metrics': calibration_metrics or {},
        },
        checkpoint_path,
    )

    model_config = {
        'input_size': cfg.input_size,
        'threshold': threshold,
        'temperature': temperature,
        'labels': class_names,
        'batch_size': cfg.batch_size,
        'epochs': cfg.epochs,
        'warmup_epochs': cfg.warmup_epochs,
        'learning_rate_head': cfg.learning_rate_head,
        'learning_rate_backbone': cfg.learning_rate_backbone,
        'weight_decay': cfg.weight_decay,
        'label_smoothing': cfg.label_smoothing,
        'dropout': cfg.dropout,
        'metrics': {
            'accuracy': metrics['accuracy'],
            'macro_precision': metrics['macro_precision'],
            'macro_recall': metrics['macro_recall'],
            'macro_f1': metrics['macro_f1'],
        },
        'calibration': calibration_metrics or {},
    }
    (cfg.output_dir / 'class_names.json').write_text(json.dumps(class_names, indent=2), encoding='utf-8')
    (cfg.output_dir / 'model_config.json').write_text(json.dumps(model_config, indent=2), encoding='utf-8')
    (cfg.output_dir / 'training_metrics.json').write_text(json.dumps(metrics, indent=2), encoding='utf-8')


def main() -> None:
    cfg = parse_args()
    set_seed(cfg.seed)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    train_loader, val_loader, class_names, train_targets = build_dataloaders(cfg)

    if len(class_names) < 2:
        raise ValueError('Expected at least two classes for authenticity classification.')

    model = build_model(len(class_names), cfg.dropout, device)
    class_weights = _class_weights(train_targets, len(class_names))
    use_class_weights = cfg.imbalance_strategy in {'class_weights', 'both'}
    weight_tensor = None
    if use_class_weights:
        weight_tensor = torch.tensor([class_weights[index] for index in range(len(class_names))], dtype=torch.float32, device=device)
    criterion = nn.CrossEntropyLoss(weight=weight_tensor, label_smoothing=cfg.label_smoothing)
    scaler = GradScaler(enabled=device.type == 'cuda')

    warmup_optimizer = build_optimizer(model, cfg, 'warmup') if cfg.warmup_epochs > 0 else None
    warmup_scheduler = (
        build_stage_scheduler(
            warmup_optimizer,
            stage_epochs=cfg.warmup_epochs,
            warmup_epochs=max(0, min(1, cfg.warmup_epochs - 1)),
            min_lr_ratio=cfg.scheduler_min_lr_ratio,
        )
        if warmup_optimizer is not None
        else None
    )

    finetune_epochs = max(cfg.epochs - cfg.warmup_epochs, 0)
    finetune_optimizer = build_optimizer(model, cfg, 'finetune')
    finetune_scheduler = build_stage_scheduler(
        finetune_optimizer,
        stage_epochs=max(finetune_epochs, 1),
        warmup_epochs=cfg.finetune_warmup_epochs,
        min_lr_ratio=cfg.scheduler_min_lr_ratio,
    )

    best_state_dict = None
    best_threshold = 0.5
    best_score = -1.0
    best_metrics: dict[str, float | list[int] | list[float]] = {'macro_f1': -1.0, 'accuracy': 0.0, 'macro_precision': 0.0, 'macro_recall': 0.0, 'per_class_precision': [], 'per_class_recall': [], 'per_class_f1': [], 'probabilities': [], 'targets': [], 'predictions': []}
    patience_counter = 0
    stage_epoch_index = {'warmup': 0, 'finetune': 0}
    previous_stage: str | None = None

    for epoch in range(cfg.epochs):
        stage = 'warmup' if epoch < cfg.warmup_epochs else 'finetune'
        if stage != previous_stage:
            set_trainable_parameters(model, stage)
            previous_stage = stage

        if stage == 'warmup' and warmup_optimizer is not None:
            optimizer = warmup_optimizer
            scheduler = warmup_scheduler
        else:
            optimizer = finetune_optimizer
            scheduler = finetune_scheduler

        train_loss = train_one_epoch(model, train_loader, criterion, optimizer, device, scaler, cfg.grad_clip_norm)
        metrics = evaluate(model, val_loader, device)
        threshold, threshold_f1 = tune_threshold(metrics['targets'], metrics['probabilities'])
        current_score = max(float(metrics['macro_f1']), float(threshold_f1))

        if scheduler is not None:
            scheduler.step()

        current_lr = optimizer.param_groups[0]['lr']
        stage_epoch_index[stage] += 1

        print(
            f"Epoch {epoch + 1}/{cfg.epochs} | stage={stage} | train_loss={train_loss:.4f} | "
            f"val_acc={float(metrics['accuracy']):.4f} | val_macro_f1={float(metrics['macro_f1']):.4f} | "
            f"threshold={threshold:.2f} | lr={current_lr:.6g}"
        )

        if current_score > best_score:
            best_metrics = metrics
            best_state_dict = {key: value.detach().cpu() for key, value in model.state_dict().items()}
            best_threshold = threshold
            best_score = current_score
            patience_counter = 0
        else:
            patience_counter += 1

        if patience_counter >= cfg.patience:
            print('Early stopping triggered.')
            break

    if best_state_dict is None:
        best_state_dict = {key: value.detach().cpu() for key, value in model.state_dict().items()}

    model.load_state_dict(best_state_dict)
    temperature = 1.0
    calibration_metrics: dict[str, float] | None = None

    if cfg.enable_temperature_scaling:
        logits, targets = collect_logits_and_targets(model, val_loader, device)
        if logits.numel() > 0 and targets.numel() > 0:
            temperature = fit_temperature(logits, targets, device)
            with torch.no_grad():
                calibrated_prob = torch.softmax(logits / temperature, dim=1)
            positive_prob = calibrated_prob[:, 1] if calibrated_prob.shape[1] > 1 else calibrated_prob[:, 0]
            y_true = targets.numpy().astype(np.int64).tolist()
            y_prob = positive_prob.numpy().astype(np.float32).tolist()
            tuned_threshold, _ = tune_threshold(y_true, y_prob)
            y_pred = (np.asarray(y_prob, dtype=np.float32) >= tuned_threshold).astype(np.int64).tolist()
            tuned_metrics = compute_metrics(y_true, y_pred, y_prob)
            calibration_metrics = {
                'temperature': temperature,
                'tuned_threshold': tuned_threshold,
                'macro_f1': float(tuned_metrics['macro_f1']),
                'macro_precision': float(tuned_metrics['macro_precision']),
                'macro_recall': float(tuned_metrics['macro_recall']),
                'accuracy': float(tuned_metrics['accuracy']),
            }

    save_artifacts(model, class_names, cfg, best_metrics, best_threshold, temperature, calibration_metrics)
    print(f'Saved best checkpoint to {cfg.output_dir / "best_model.pth"}')
    print(f'Best validation metrics: {json.dumps({k: best_metrics[k] for k in ["accuracy", "macro_precision", "macro_recall", "macro_f1"]}, indent=2)}')
    if calibration_metrics is not None:
        print(f'Temperature scaling metrics: {json.dumps(calibration_metrics, indent=2)}')


if __name__ == '__main__':
    main()
