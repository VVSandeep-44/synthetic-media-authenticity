from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal['ok'] = 'ok'


class ImagePredictionResponse(BaseModel):
    label: str
    confidence: float = Field(ge=0.0, le=1.0)
    gradcam_overlay_base64: str
    vit_overlay_base64: str
    explanation_text: str


PredictionResponse = ImagePredictionResponse
ExplainResponse = ImagePredictionResponse


class VideoFrameExplanation(BaseModel):
    frame_index: int
    label: str
    confidence: float = Field(ge=0.0, le=1.0)
    gradcam_overlay_base64: str
    vit_overlay_base64: str
    explanation_text: str


class VideoPredictionResponse(BaseModel):
    label: str
    confidence: float = Field(ge=0.0, le=1.0)
    sampled_frames_explanations: list[VideoFrameExplanation]
