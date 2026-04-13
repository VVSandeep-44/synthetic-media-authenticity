from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas import PredictionResponse, VideoPredictionResponse
from app.services.inference_service import predict_image_file
from app.services.video_service import predict_video_file
from app.utils.errors import MediaAnalysisError

router = APIRouter(prefix='/predict', tags=['predict'])


@router.post('/image', response_model=PredictionResponse)
async def predict_image(file: UploadFile = File(...)) -> PredictionResponse:
    try:
        return await predict_image_file(file)
    except MediaAnalysisError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post('/video', response_model=VideoPredictionResponse)
async def predict_video(file: UploadFile = File(...)) -> VideoPredictionResponse:
    try:
        return await predict_video_file(file)
    except MediaAnalysisError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
