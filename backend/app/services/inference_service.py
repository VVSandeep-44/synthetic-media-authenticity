from fastapi import UploadFile

from app.schemas import PredictionResponse
from app.services.explain_service import build_image_prediction
from app.utils.io import detect_media_kind, read_upload_bytes


async def predict_image_file(file: UploadFile) -> PredictionResponse:
    data = await read_upload_bytes(file)
    media_kind = detect_media_kind(file.filename, file.content_type)

    if media_kind == 'video':
        raise ValueError('Use the video endpoint for video uploads.')

    if not data:
        raise ValueError('Empty file received.')

    return build_image_prediction(data, filename=file.filename, content_type=file.content_type)
