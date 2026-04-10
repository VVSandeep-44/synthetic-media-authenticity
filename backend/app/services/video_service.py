from fastapi import UploadFile

from app.schemas import VideoPredictionResponse
from app.services.explain_service import build_video_prediction
from app.utils.io import read_upload_bytes


async def predict_video_file(file: UploadFile) -> VideoPredictionResponse:
    data = await read_upload_bytes(file)

    if not data:
        raise ValueError('Empty file received.')

    return build_video_prediction(data, filename=file.filename, content_type=file.content_type)
