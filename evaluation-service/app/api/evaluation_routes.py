import logging
from fastapi import APIRouter, HTTPException
from app.schemas.evaluation_schemas import EvaluationRequest, EvaluationResponse
from app.services.evaluation_service import EvaluationService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Service (Singleton pattern effectively)
evaluation_service = EvaluationService()

@router.post("/", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest):
    """
    Strict Contract-Driven Evaluation Pipeline.
    Delegates all logic to EvaluationService.
    """
    try:
        logger.info(f"Received evaluation request for Q: {request.question[:30]}...")
        
        response = await evaluation_service.evaluate_student_answer(request)
        
        logger.info(f"Evaluation complete. Score: {response.final_score}, Grade: {response.grade}")
        return response

    except Exception as e:
        logger.error(f"❌ SERVICE ERROR: {str(e)}", exc_info=True)
        # In a real production app, we might want to return a cleaner error or a fallback
        # But for now, 500 is appropriate for unhandled orchestration errors.
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
