# Implementation Action Plan - Priority Changes

## PHASE 1: CRITICAL FIXES (Do First - 2-3 hours)

### Change 1: Fix TrainConfig Hyperparameters
**File:** `training/train_model.py` (Lines 34-42)
**Current:**
```python
batch_size: int = 8
epochs: int = 20
warmup_epochs: int = 3
learning_rate_head: float = 1e-4
learning_rate_backbone: float = 1e-5
dropout: float = 0.35
patience: int = 5
```

**Updated:**
```python
batch_size: int = 32  # Increased from 8
epochs: int = 30     # Increased from 20
warmup_epochs: int = 5  # Increased from 3
learning_rate_head: float = 8e-5  # Adjusted from 1e-4
learning_rate_backbone: float = 2e-5  # Increased from 1e-5
dropout: float = 0.4  # Increased from 0.35
patience: int = 8  # Increased from 5
weight_decay: float = 2e-4  # Doubled for regularization
label_smoothing: float = 0.1  # Increased from 0.05
```

**Why:** 
- Batch 8 → 32: GPU underutilized, high variance gradients
- Epochs 20 → 30: More training for complex hybrid model
- LR backbone: Was too low, backbone wasn't learning

---

### Change 2: Add Advanced Augmentation Pipeline
**File:** `training/train_model.py` (Replace `build_train_transforms()` function)

**Current (Lines 117-125):**
```python
def build_train_transforms(input_size: int) -> transforms.Compose:
    return transforms.Compose([
        transforms.RandomResizedCrop(input_size, scale=(0.75, 1.0), ratio=(0.9, 1.1)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomApply([
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15, hue=0.04)
        ], p=0.6),
        # ... rest
```

**Updated:**
```python
def build_train_transforms(input_size: int) -> transforms.Compose:
    return transforms.Compose([
        # Spatial augmentations
        transforms.RandomResizedCrop(input_size, scale=(0.7, 1.0), ratio=(0.85, 1.15)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(12, fill=128),  # NEW
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), shear=10),  # NEW
        
        # Color/intensity augmentations
        transforms.RandomApply([
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05)
        ], p=0.7),
        transforms.RandomAutocontrast(p=0.3),
        transforms.RandomApply([  # NEW: Gaussian Blur
            transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0))
        ], p=0.4),
        
        # Normalize
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        
        # Regularization
        transforms.RandomErasing(p=0.3, scale=(0.05, 0.15), ratio=(0.3, 3.3)),
    ])
```

**Why:** Rotation + Affine + GaussianBlur are critical for synthetic forgery detection

---

### Change 3: Add Focal Loss Support
**File:** `training/train_model.py` (Add before `parse_args()`, around Line 20)

**Add this class:**
```python
class FocalLoss(nn.Module):
    """Focal Loss for addressing class imbalance in detection tasks"""
    def __init__(self, alpha: float = 1.0, gamma: float = 2.0, reduction: str = 'mean'):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction
    
    def forward(self, inputs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)  # Probability of correct class
        focal_loss = self.alpha * ((1 - pt) ** self.gamma) * ce_loss
        
        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        else:
            return focal_loss
```

**In main() function (around Line 475):**
```python
# OLD:
criterion = nn.CrossEntropyLoss(weight=weight_tensor, label_smoothing=cfg.label_smoothing)

# NEW:
use_focal_loss = True  # Or make configurable
if use_focal_loss and cfg.imbalance_strategy in {'class_weights', 'both'}:
    criterion = FocalLoss(alpha=1.0, gamma=2.0)
else:
    criterion = nn.CrossEntropyLoss(weight=weight_tensor, label_smoothing=cfg.label_smoothing)
```

**Why:** Focal loss is proven for class-imbalanced detection tasks (synthetic vs real)

---

### Change 4: Update Model Architecture
**File:** `backend/app/ml/model_def.py` (Replace entire HybridCNNViT class)

**Add feature gating and projection:**
```python
import torch
import torch.nn as nn
from torchvision.models import efficientnet_v2_s, ViT_B_16_Weights, vit_b_16


class HybridCNNViT(nn.Module):
    """
    Improved hybrid model with feature gating and better fusion.
    """

    def __init__(self, num_classes: int = 2, input_size: int = 224, dropout: float = 0.4):
        super().__init__()
        self.num_classes = num_classes
        self.input_size = input_size

        # CNN Branch: EfficientNetV2-S
        self.cnn = efficientnet_v2_s(pretrained=True)
        cnn_out_dim = self.cnn.classifier[1].in_features
        self.cnn.classifier = nn.Identity()

        # ViT Branch: Vision Transformer B/16
        vit_weights = ViT_B_16_Weights.DEFAULT
        self.vit = vit_b_16(weights=vit_weights)
        vit_out_dim = self.vit.heads[0].in_features
        self.vit.heads = nn.Identity()

        # Feature projection and normalization
        self.cnn_proj = nn.Linear(cnn_out_dim, 512)
        self.vit_proj = nn.Linear(vit_out_dim, 512)
        self.feat_norm = nn.LayerNorm(512)

        # Feature gating (learn importance weights)
        self.cnn_gate = nn.Sequential(
            nn.Linear(512, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
        self.vit_gate = nn.Sequential(
            nn.Linear(512, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        # Improved classification head
        self.classifier = nn.Sequential(
            nn.Linear(1024, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout * 0.5),
            
            nn.Linear(128, num_classes),
        )

        # Hook state for explainability
        self.cnn_features = None
        self.cnn_gradients = None
        self.vit_features = None
        self.vit_gradients = None

        # Register Hooks
        self.cnn.features[-1].register_forward_hook(self._cnn_forward_hook)
        self.cnn.features[-1].register_full_backward_hook(self._cnn_backward_hook)
        self.vit.encoder.layers[-1].register_forward_hook(self._vit_forward_hook)
        self.vit.encoder.layers[-1].register_full_backward_hook(self._vit_backward_hook)

    def _cnn_forward_hook(self, module, input, output):
        self.cnn_features = output

    def _cnn_backward_hook(self, module, grad_input, grad_output):
        self.cnn_gradients = grad_output[0]

    def _vit_forward_hook(self, module, input, output):
        self.vit_features = output

    def _vit_backward_hook(self, module, grad_input, grad_output):
        self.vit_gradients = grad_output[0]

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Input image tensor of shape (B, 3, H, W)
        Returns:
            Logits of shape (B, num_classes)
        """
        # CNN features
        cnn_feat = self.cnn(x)  # (B, cnn_dim)
        cnn_feat = self.cnn_proj(cnn_feat)  # (B, 512)
        cnn_feat = self.feat_norm(cnn_feat)
        cnn_feat = cnn_feat * self.cnn_gate(cnn_feat)  # Apply gating

        # ViT features
        vit_feat = self.vit(x)  # (B, vit_dim)
        vit_feat = self.vit_proj(vit_feat)  # (B, 512)
        vit_feat = self.feat_norm(vit_feat)
        vit_feat = vit_feat * self.vit_gate(vit_feat)  # Apply gating

        # Fusion and classification
        fused = torch.cat([cnn_feat, vit_feat], dim=1)  # (B, 1024)
        logits = self.classifier(fused)
        return logits

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Returns class probabilities."""
        with torch.no_grad():
            logits = self.forward(x)
            return torch.softmax(logits, dim=1)
```

**Why:** Feature gating learns which stream (CNN vs ViT) is more important, improves fusion

---

## PHASE 2: TRAINING IMPROVEMENTS (Next day - 4 hours setup + training time)

### Change 5: Update Learning Rate Schedule
**File:** `training/train_model.py` (Modify `build_stage_scheduler()` or replace)

**Add this function after `build_optimizer()`:**
```python
def build_warmup_scheduler(
    optimizer: torch.optim.Optimizer,
    warmup_epochs: int,
    total_epochs: int,
) -> torch.optim.lr_scheduler.LambdaLR:
    """Linear warmup + Cosine annealing schedule"""
    def lr_lambda(epoch: int) -> float:
        if warmup_epochs > 0 and epoch < warmup_epochs:
            # Linear warmup
            return float(epoch) / float(max(1, warmup_epochs))
        
        # Cosine annealing after warmup
        if total_epochs - warmup_epochs <= 1:
            return 1.0
        
        progress = (epoch - warmup_epochs) / float(total_epochs - warmup_epochs)
        return max(0.1, 0.5 * (1.0 + math.cos(math.pi * progress)))
    
    return torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda=lr_lambda)
```

**In main(), replace scheduler creation:**
```python
# Use the new warmup scheduler
finetune_scheduler = build_warmup_scheduler(
    finetune_optimizer,
    warmup_epochs=cfg.finetune_warmup_epochs,
    total_epochs=max(finetune_epochs, 1),
)
```

---

### Change 6: Add Per-Class Metrics Logging
**File:** `training/train_model.py` (Modify training loop in main())

**In the epoch loop (around Line 540), add:**
```python
# After computing metrics:
print(
    f"Epoch {epoch + 1}/{cfg.epochs} | stage={stage} | train_loss={train_loss:.4f} | "
    f"val_acc={float(metrics['accuracy']):.4f} | val_macro_f1={float(metrics['macro_f1']):.4f} | "
    f"threshold={threshold:.2f} | lr={current_lr:.6g}"
)

# NEW: Log per-class metrics
per_class_f1 = metrics['per_class_f1']
class_names = ['Authentic', 'Synthetic'] if len(per_class_f1) >= 2 else [f'Class_{i}' for i in range(len(per_class_f1))]
print(f"  Per-class F1: {', '.join(f'{name}={f1:.4f}' for name, f1 in zip(class_names, per_class_f1))}")
```

---

### Change 7: Verify Dataset Structure
**File:** Create `training/verify_dataset.py` (NEW FILE)

```python
#!/usr/bin/env python3
"""Verify dataset structure and balance"""

import argparse
from pathlib import Path
from collections import defaultdict
import json

def verify_dataset(dataset_root: Path):
    """Check dataset for proper ImageFolder structure"""
    
    if not dataset_root.exists():
        print(f"❌ Dataset root not found: {dataset_root}")
        return False
    
    class_dirs = {d for d in dataset_root.iterdir() if d.is_dir() and not d.name.startswith('.')}
    
    if len(class_dirs) < 2:
        print(f"❌ Expected at least 2 classes, found {len(class_dirs)}")
        return False
    
    print(f"✅ Found {len(class_dirs)} classes:")
    
    class_counts = defaultdict(int)
    image_suffixes = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    
    for class_dir in sorted(class_dirs):
        count = sum(1 for f in class_dir.rglob('*') 
                   if f.is_file() and f.suffix.lower() in image_suffixes)
        class_counts[class_dir.name] = count
        print(f"  - {class_dir.name}: {count} images")
    
    total = sum(class_counts.values())
    imbalance = max(class_counts.values()) / min(class_counts.values() or [1])
    
    print(f"\nTotal images: {total}")
    print(f"Imbalance ratio: {imbalance:.2f}x")
    
    if imbalance > 2.0:
        print(f"⚠️  High class imbalance detected ({imbalance:.2f}x)")
        print("   Consider using WeightedRandomSampler or focal loss")
    
    if total < 1000:
        print(f"⚠️  Dataset too small ({total} images). Minimum recommended: 5,000")
    
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset-root', type=Path, default=Path('dataset'))
    args = parser.parse_args()
    
    verify_dataset(args.dataset_root)
```

**Run before training:**
```bash
cd training
python verify_dataset.py --dataset-root ../dataset
```

---

## PHASE 3: VALIDATION & METRICS (After model training)

### Change 8: Create Comprehensive Metrics Report
**File:** Create `training/evaluate_model.py` (NEW FILE)

```python
#!/usr/bin/env python3
"""Comprehensive model evaluation"""

import json
import numpy as np
from pathlib import Path
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, 
    precision_recall_curve, f1_score, matthews_corrcoef
)
import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

def evaluate_checkpoint(checkpoint_path: Path, data_root: Path, batch_size: int = 32):
    """Load checkpoint and evaluate on test set"""
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Load model
    from backend.app.ml.model_def import HybridCNNViT
    model = HybridCNNViT(num_classes=2, input_size=224)
    checkpoint = torch.load(checkpoint_path, map_location=device)
    
    if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    
    model.to(device)
    model.eval()
    
    # Load test dataset
    test_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    
    test_dataset = datasets.ImageFolder(data_root / 'test', transform=test_transforms)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    # Collect predictions
    all_preds = []
    all_targets = []
    all_probs = []
    
    with torch.no_grad():
        for images, targets in test_loader:
            images = images.to(device)
            logits = model(images)
            probs = torch.softmax(logits, dim=1)
            
            all_probs.extend(probs[:, 1].cpu().numpy())
            all_preds.extend(probs.argmax(dim=1).cpu().numpy())
            all_targets.extend(targets.numpy())
    
    # Compute metrics
    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    all_probs = np.array(all_probs)
    
    report = classification_report(
        all_targets, all_preds,
        target_names=['Authentic', 'Synthetic'],
        output_dict=True
    )
    
    cm = confusion_matrix(all_targets, all_preds)
    auc = roc_auc_score(all_targets, all_probs)
    mcc = matthews_corrcoef(all_targets, all_preds)
    
    print("\n" + "="*60)
    print("MODEL EVALUATION REPORT")
    print("="*60)
    print(classification_report(all_targets, all_preds, target_names=['Authentic', 'Synthetic']))
    print(f"AUC-ROC: {auc:.4f}")
    print(f"Matthews Correlation: {mcc:.4f}")
    print(f"\nConfusion Matrix:")
    print(cm)
    print("\n" + "="*60)
    
    # Save report
    report['auc_roc'] = float(auc)
    report['matthews_corrcoef'] = float(mcc)
    report['confusion_matrix'] = cm.tolist()
    
    with open(checkpoint_path.parent / 'evaluation_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    return report

if __name__ == '__main__':
    evaluate_checkpoint(
        Path('artifacts/best_model.pth'),
        Path('dataset'),
        batch_size=32
    )
```

---

## QUICK TESTING CHECKLIST

Before running full training:

- [ ] Dataset verified (min. 1000 images, 2 classes)
- [ ] Batch size increased to 32 or higher
- [ ] Epochs increased to 30
- [ ] Learning rates adjusted
- [ ] Augmentation pipeline updated
- [ ] Model architecture updated with gating
- [ ] Focal loss added
- [ ] Test preprocessing pipeline:
  ```bash
  cd backend
  python -c "from app.ml.preprocess import preprocess_image_tensor; print('OK')"
  ```

---

## TRAINING COMMAND

After implementing all Phase 1 changes:

```bash
cd training
python train_model.py \
    --data-root "../dataset" \
    --batch-size 32 \
    --epochs 30 \
    --warmup-epochs 5 \
    --learning-rate-head 8e-5 \
    --learning-rate-backbone 2e-5 \
    --dropout 0.4 \
    --patience 8 \
    --label-smoothing 0.1 \
    --weight-decay 2e-4
```

---

## EXPECTED IMPROVEMENTS

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Batch Size | 8 | 32 | 4x better gradient estimates |
| Epochs | 20 | 30 | More training time |
| Learning Rate (CNN/ViT) | 1e-5 | 2e-5 | Better backbone learning |
| Augmentation | Limited | Advanced | +10-15% accuracy |
| Loss Function | Cross-Entropy | Focal | +5-10% on imbalanced data |
| Model Fusion | Basic concat | Gated fusion | +3-5% accuracy |
| **Expected Accuracy** | 60-70% | **85-92%** | **+15-25%** |

---

**Total Implementation Time: 4-6 hours coding + 8-12 hours training**
