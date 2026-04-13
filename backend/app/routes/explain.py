from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas import ExplainResponse
from app.services.explain_service import explain_media_file
from app.utils.errors import MediaAnalysisError

router = APIRouter(prefix='/explain', tags=['explain'])


@router.post('', response_model=ExplainResponse)
async def explain_media(file: UploadFile = File(...)) -> ExplainResponse:
    try:
        return await explain_media_file(file)
    except MediaAnalysisError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
