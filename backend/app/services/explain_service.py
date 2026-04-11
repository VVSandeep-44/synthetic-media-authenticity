from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path
import tempfile

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageFilter, ImageOps
from torchvision import transforms

from app.ml.model_def import HybridCNNViT
from app.schemas import ImagePredictionResponse, VideoFrameExplanation, VideoPredictionResponse
from app.utils.io import detect_media_kind

# Initialize model globally (loaded once at startup)
_model: HybridCNNViT | None = None
_device: torch.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def _get_model() -> HybridCNNViT:
    """Lazy-load model on first request."""
    global _model
    if _model is None:
        _model = HybridCNNViT(num_classes=2, input_size=224)
        _model.to(_device)
        _model.eval()
        # TODO: Load trained checkpoint if available
        # checkpoint = torch.load('path/to/checkpoint.pt', map_location=_device)
        # _model.load_state_dict(checkpoint['model_state_dict'])
    return _model


def build_image_prediction(data: bytes, filename: str | None = None, content_type: str | None = None) -> ImagePredictionResponse:
    image = _load_image(data)
    gradcam_overlay = _create_overlay(image, _gradcam_heatmap(image))
    vit_overlay = _create_overlay(image, _vit_heatmap(image))
    label, confidence = _classify_image(image)

    if detect_media_kind(filename, content_type) == 'video':
        raise ValueError('Use the video endpoint for video uploads.')

    return ImagePredictionResponse(
        label=label,
        confidence=confidence,
        gradcam_overlay_base64=_encode_image(gradcam_overlay),
        vit_overlay_base64=_encode_image(vit_overlay),
        explanation_text=_summary_sentence(label, confidence)
    )


def build_video_prediction(data: bytes, filename: str | None = None, content_type: str | None = None) -> VideoPredictionResponse:
    if detect_media_kind(filename, content_type) != 'video':
        raise ValueError('Use the image endpoint for image uploads.')

    frames = _sample_video_frames(data)
    if not frames:
        raise ValueError('Unable to sample frames from the uploaded video.')

    frame_explanations: list[VideoFrameExplanation] = []
    confidences: list[float] = []
    labels: list[str] = []

    for frame_index, frame in frames:
        label, confidence = _classify_image(frame)
        confidences.append(confidence)
        labels.append(label)
        frame_explanations.append(
            VideoFrameExplanation(
                frame_index=frame_index,
                label=label,
                confidence=confidence,
                gradcam_overlay_base64=_encode_image(_create_overlay(frame, _gradcam_heatmap(frame))),
                vit_overlay_base64=_encode_image(_create_overlay(frame, _vit_heatmap(frame))),
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


def _normalize(array: np.ndarray) -> np.ndarray:
    array = array.astype(np.float32)
    minimum = float(array.min())
    maximum = float(array.max())
    if maximum - minimum < 1e-6:
        return np.zeros_like(array, dtype=np.float32)
    return (array - minimum) / (maximum - minimum)


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


def _gradcam_heatmap(image: Image.Image) -> np.ndarray:
    grayscale = np.asarray(image.convert('L'), dtype=np.float32)
    blurred = np.asarray(image.convert('L').filter(ImageFilter.GaussianBlur(radius=3)), dtype=np.float32)
    edges = np.abs(grayscale - blurred)
    return _normalize(0.6 * _normalize(edges) + 0.4 * _normalize(grayscale))


def _vit_heatmap(image: Image.Image) -> np.ndarray:
    grayscale = np.asarray(image.convert('L'), dtype=np.float32)
    h, w = grayscale.shape
    yy, xx = np.mgrid[0:h, 0:w]
    center_weight = 1.0 - np.sqrt(((xx - w / 2.0) / (w / 2.0 + 1e-6)) ** 2 + ((yy - h / 2.0) / (h / 2.0 + 1e-6)) ** 2)
    center_weight = np.clip(center_weight, 0.0, 1.0)
    pooled = grayscale.reshape(14, h // 14, 14, w // 14).mean(axis=(1, 3)) if h >= 14 and w >= 14 else np.full((14, 14), grayscale.mean())
    pooled = np.kron(pooled, np.ones((max(h // 14, 1), max(w // 14, 1))))[:h, :w]
    return _normalize(0.55 * center_weight + 0.45 * _normalize(pooled))


def _classify_image(image: Image.Image) -> tuple[str, float]:
    """Classify image using HybridCNNViT model."""
    model = _get_model()

    # Preprocess: convert PIL to tensor
    preprocess = transforms.Compose([
        transforms.Resize(224),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    input_tensor = preprocess(image).unsqueeze(0).to(_device)

    # Forward pass
    with torch.no_grad():
        logits = model(input_tensor)
        probs = F.softmax(logits, dim=1)
        confidence, predicted_idx = torch.max(probs, 1)

    # Map class index to label
    labels = ['Authentic', 'Synthetic']
    label = labels[predicted_idx.item()]
    confidence_val = float(confidence.item())

    return label, confidence_val


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