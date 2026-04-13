from __future__ import annotations

import base64
from io import BytesIO
import json
from pathlib import Path
import tempfile

import cv2
import numpy as np
from PIL import Image, ImageOps

from app.config import get_settings
from app.ml.postprocess import resolve_label
from app.schemas import ImagePredictionResponse, VideoFrameExplanation, VideoPredictionResponse
from app.utils.errors import CheckpointNotFoundError, InvalidCheckpointError, RuntimeDependencyError, UnsupportedMediaTypeError, VideoProcessingError
from app.utils.io import detect_media_kind

# Initialize model globally (loaded once at startup)
_model = None
_class_names: list[str] | None = None
_model_config: dict | None = None
_torch = None
_F = None
_device = None


def _ensure_torch_runtime():
    global _torch, _F, _device
    if _torch is None or _F is None or _device is None:
        try:
            import torch
            import torch.nn.functional as functional
        except OSError as error:
            raise RuntimeDependencyError(
                f'PyTorch runtime could not be loaded: {error}. '
                'Increase Windows paging file size or install CPU-only PyTorch.'
            ) from error
        _torch = torch
        _F = functional
        _device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    return _torch, _F, _device


def _load_class_names() -> list[str]:
    global _class_names
    if _class_names is not None:
        return _class_names

    settings = get_settings()
    class_names_path = Path(settings.class_names_path)
    if not class_names_path.exists():
        _class_names = ['Authentic', 'Synthetic']
        return _class_names

    try:
        with class_names_path.open('r', encoding='utf-8') as handle:
            loaded = json.load(handle)
        if isinstance(loaded, list) and loaded:
            _class_names = [str(item) for item in loaded]
        else:
            _class_names = ['Authentic', 'Synthetic']
    except Exception:
        _class_names = ['Authentic', 'Synthetic']

    return _class_names


def _load_model_config() -> dict:
    global _model_config
    if _model_config is not None:
        return _model_config

    settings = get_settings()
    model_config_path = Path(settings.model_config_path)
    if not model_config_path.exists():
        _model_config = {'input_size': 224, 'threshold': 0.5}
        return _model_config

    try:
        with model_config_path.open('r', encoding='utf-8') as handle:
            loaded = json.load(handle)
            if isinstance(loaded, dict):
                _model_config = loaded
            else:
                _model_config = {'input_size': 224, 'threshold': 0.5}
    except Exception:
        _model_config = {'input_size': 224, 'threshold': 0.5}

    return _model_config


def _get_model():
    """Lazy-load model on first request."""
    global _model
    if _model is None:
        torch, _, device = _ensure_torch_runtime()
        try:
            from app.ml.model_def import HybridCNNViT
        except OSError as error:
            raise RuntimeDependencyError(
                f'Model dependencies could not be loaded: {error}. '
                'Increase Windows paging file size or install CPU-only PyTorch.'
            ) from error

        settings = get_settings()
        class_names = _load_class_names()
        _model = HybridCNNViT(num_classes=len(class_names), input_size=224)
        _model.to(device)
        checkpoint_path = Path(settings.model_path)
        if not checkpoint_path.exists():
            raise CheckpointNotFoundError(f'Model checkpoint not found at {checkpoint_path}.')

        try:
            checkpoint = torch.load(checkpoint_path, map_location=device)
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                state_dict = checkpoint['model_state_dict']
            elif isinstance(checkpoint, dict):
                state_dict = checkpoint
            else:
                raise InvalidCheckpointError('Checkpoint format is not a state dict.')

            _model.load_state_dict(state_dict)
        except Exception as error:
            raise InvalidCheckpointError(f'Failed to load checkpoint at {checkpoint_path}: {error}') from error

        _model.eval()
        # Ensure parameters require grad for Grad-CAM
        for param in _model.parameters():
            param.requires_grad = True
    return _model


def build_image_prediction(data: bytes, filename: str | None = None, content_type: str | None = None) -> ImagePredictionResponse:
    image = _load_image(data)
    
    if detect_media_kind(filename, content_type) == 'video':
        raise UnsupportedMediaTypeError('Use the video endpoint for video uploads.')
        
    label, confidence, gradcam_hm, vit_hm = _classify_image(image)
    
    gradcam_overlay = _create_overlay(image, gradcam_hm)
    vit_overlay = _create_overlay(image, vit_hm)

    return ImagePredictionResponse(
        label=label,
        confidence=confidence,
        gradcam_overlay_base64=_encode_image(gradcam_overlay),
        vit_overlay_base64=_encode_image(vit_overlay),
        explanation_text=_summary_sentence(label, confidence)
    )


def build_video_prediction(data: bytes, filename: str | None = None, content_type: str | None = None) -> VideoPredictionResponse:
    if detect_media_kind(filename, content_type) != 'video':
        raise UnsupportedMediaTypeError('Use the image endpoint for image uploads.')

    frames = _sample_video_frames(data)
    if not frames:
        raise VideoProcessingError('Unable to sample frames from the uploaded video.')

    frame_explanations: list[VideoFrameExplanation] = []
    frame_images = [frame for _, frame in frames]
    predictions = _classify_images(frame_images)
    labels = [label for label, _, _, _ in predictions]
    confidences = [confidence for _, confidence, _, _ in predictions]

    for (frame_index, frame), (label, confidence, gradcam_hm, vit_hm) in zip(frames, predictions):
        frame_explanations.append(
            VideoFrameExplanation(
                frame_index=frame_index,
                label=label,
                confidence=confidence,
                gradcam_overlay_base64=_encode_image(_create_overlay(frame, gradcam_hm)),
                vit_overlay_base64=_encode_image(_create_overlay(frame, vit_hm)),
                explanation_text=_summary_sentence(label, confidence, frame_index=frame_index)
            )
        )

    return VideoPredictionResponse(
        label=_aggregate_label(labels),
        confidence=float(np.clip(np.mean(confidences), 0.0, 1.0)),
        sampled_frames_explanations=frame_explanations
    )


async def explain_media_file(file):
    data = await file.read()
    return build_image_prediction(data, filename=file.filename, content_type=file.content_type)


def _load_image(data: bytes) -> Image.Image:
    image = Image.open(BytesIO(data))
    return ImageOps.exif_transpose(image).convert('RGB').resize((224, 224))


def _encode_image(image: Image.Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('ascii')


def _colorize_heatmap(heatmap: np.ndarray) -> Image.Image:
    heatmap = np.clip(heatmap, 0.0, 1.0)
    red = (255 * np.clip(1.5 * heatmap, 0.0, 1.0)).astype(np.uint8)
    green = (255 * np.clip(1.2 * (1.0 - np.abs(heatmap - 0.5) * 2.0), 0.0, 1.0)).astype(np.uint8)
    blue = (255 * np.clip(1.0 - heatmap, 0.0, 1.0)).astype(np.uint8)
    stacked = np.stack([red, green, blue], axis=-1)
    return Image.fromarray(stacked, mode='RGB')


def _create_overlay(image: Image.Image, heatmap: np.ndarray) -> Image.Image:
    base = image.copy().resize((224, 224))
    colorized = _colorize_heatmap(heatmap).resize(base.size)
    return Image.blend(base, colorized, alpha=0.45)


def _classify_image(image: Image.Image) -> tuple[str, float, np.ndarray, np.ndarray]:
    return _classify_images([image])[0]


def _classify_images(images: list[Image.Image]) -> list[tuple[str, float, np.ndarray, np.ndarray]]:
    """Classify one or more images using a single model forward pass, extracting gradients for Grad-CAM."""
    if not images:
        return []

    torch, F, device = _ensure_torch_runtime()
    from app.ml.preprocess import preprocess_image_tensor

    model = _get_model()
    class_names = _load_class_names()
    model_config = _load_model_config()
    threshold = float(model_config.get('threshold', 0.5))
    positive_index = 1 if len(class_names) > 1 else 0
    batch = torch.stack([preprocess_image_tensor(image, input_size=224) for image in images], dim=0).to(device)
    batch.requires_grad = True

    model.zero_grad()
    logits = model(batch)
    probs = F.softmax(logits, dim=1)
    probability_rows = probs.detach().cpu().tolist()
    predicted_idx_values = []
    resolved_predictions: list[tuple[str, float]] = []

    for row in probability_rows:
        label, confidence = resolve_label(row, class_names, threshold=threshold, positive_class_index=positive_index)
        resolved_predictions.append((label, confidence))
        if len(row) == 2:
            predicted_idx_values.append(positive_index if row[positive_index] >= threshold else 0)
        else:
            predicted_idx_values.append(int(np.argmax(row)))

    predicted_idx = torch.tensor(predicted_idx_values, device=device, dtype=torch.long)
    
    score = logits.gather(1, predicted_idx.unsqueeze(-1)).sum()
    score.backward()

    # Generate CNN Grad-CAM Heatmaps
    cnn_heatmaps = []
    if model.cnn_features is not None and model.cnn_gradients is not None:
        weights = torch.mean(model.cnn_gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * model.cnn_features, dim=1)
        cam = F.relu(cam)
        cam_min = cam.min(dim=-1, keepdim=True)[0].min(dim=-2, keepdim=True)[0]
        cam_max = cam.max(dim=-1, keepdim=True)[0].max(dim=-2, keepdim=True)[0]
        cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)
        cam_array = cam.cpu().detach().numpy()
        for i in range(len(images)):
            cnn_heatmaps.append(cam_array[i])
    else:
        cnn_heatmaps = [np.zeros((7, 7))] * len(images)

    # Generate ViT Heatmaps
    vit_heatmaps = []
    if model.vit_features is not None and model.vit_gradients is not None:
        v_feats, v_grads = model.vit_features, model.vit_gradients
        if v_feats.shape[0] == 197:  # Sequence first
            v_feats, v_grads = v_feats.transpose(0, 1), v_grads.transpose(0, 1)
        
        weights = torch.mean(v_grads, dim=2, keepdim=True)
        cam = torch.sum(weights * v_feats, dim=2)
        cam = cam[:, 1:]  # Drop CLS token
        cam = cam.reshape(cam.shape[0], 14, 14)
        cam = F.relu(cam)
        cam_min = cam.min(dim=-1, keepdim=True)[0].min(dim=-2, keepdim=True)[0]
        cam_max = cam.max(dim=-1, keepdim=True)[0].max(dim=-2, keepdim=True)[0]
        cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)
        cam_array = cam.cpu().detach().numpy()
        for i in range(len(images)):
            vit_heatmaps.append(cam_array[i])
    else:
        vit_heatmaps = [np.zeros((14, 14))] * len(images)

    return [
        (label, confidence, cnn_heatmaps[i], vit_heatmaps[i])
        for i, (label, confidence) in enumerate(resolved_predictions)
    ]


def _summary_sentence(label: str, confidence: float, frame_index: int | None = None) -> str:
    prefix = f'Frame {frame_index}: ' if frame_index is not None else ''
    return f"{prefix}The model predicts {label.lower()} content with {confidence * 100:.1f}% confidence."


def _aggregate_label(labels: list[str]) -> str:
    if not labels:
        return 'Unknown'
    return max(set(labels), key=labels.count)


def _sample_video_frames(data: bytes, max_frames: int = 4) -> list[tuple[int, Image.Image]]:
    temp_path = _write_temp_video(data)
    capture = cv2.VideoCapture(str(temp_path))
    try:
        frame_total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        if frame_total <= 0:
            return []

        sample_count = min(max_frames, frame_total)
        frame_indexes = np.linspace(0, frame_total - 1, sample_count, dtype=int)
        frames: list[tuple[int, Image.Image]] = []

        for index in frame_indexes:
            capture.set(cv2.CAP_PROP_POS_FRAMES, int(index))
            success, frame = capture.read()
            if not success:
                continue
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append((int(index), Image.fromarray(rgb).resize((224, 224))))

        return frames
    finally:
        capture.release()
        temp_path.unlink(missing_ok=True)


def _write_temp_video(data: bytes) -> Path:
    handle = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
    handle.write(data)
    handle.flush()
    handle.close()
    return Path(handle.name)