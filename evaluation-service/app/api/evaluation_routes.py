import logging
import time
import traceback
from fastapi import APIRouter, HTTPException
from app.schemas.evaluation_schemas import (
    EvaluationRequest,
    EvaluationResponse,
    RubricBreakdown,
    Metrics
)

from app.engines.descriptive_engine import DescriptiveEngine
from app.engines.similarity_engine import SimilarityEngine
from app.engines.nli_engine import NLIEngine
from app.engines.llm.judge import LLMJudge
from app.engines.aggregator import Aggregator
from app.engines.validator import Validator
from app.engines.spelling_engine import SpellingEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

descriptive_engine = DescriptiveEngine()
similarity_engine = SimilarityEngine()
nli_engine = NLIEngine()
aggregator = Aggregator()
validator = Validator()
spelling_engine = SpellingEngine()


@router.post("/", response_model=EvaluationResponse)
def evaluate(request: EvaluationRequest):
    """
    Strict Contract-Driven Evaluation Pipeline
    """
    try:
        # 1️⃣ STRICT Structural Validation Layer
        is_valid, validation_msg = validator.validate(request.student_answer)
        
        if not is_valid:
            # Short-circuit: Return 0 immediately
            return EvaluationResponse(
                final_score=0.0,
                percentage=0.0,
                grade="F",
                feedback=f"Structural check failed: {validation_msg}",
                rubric_breakdown=RubricBreakdown(
                    conceptual_understanding=0.0,
                    language_clarity=0.0,
                    answer_completeness=0.0,
                    spelling_accuracy=0.0,
                    handling_incorrect=0.0,
                    effort_bonus=0.0
                ),
                metrics=Metrics(llm=0.0, nli=0.0, similarity=0.0),
                confidence=1.0 # High confidence in structural failure
            )

        # 2️⃣ Engines Execution
        
        # A. Spelling Engine
        spelling_score = spelling_engine.check(request.student_answer)
        
        # B. Descriptive Engine (Completeness, Effort)
        descriptive_metrics = descriptive_engine.evaluate_components(request.student_answer)
        
        # C. Similarity Engine (Auxiliary metric only)
        # Note: Similarity does NOT override score, purely for metrics/debugging or slight conceptual nudge if needed.
        # Strict rules say: "Similarity only contributes to conceptual_understanding refinement."
        # For this implementation, we will pass it to Metrics but rely on LLM for conceptual score.
        # Unless we want to average it into conceptual? The Prompt says "conceptual_understanding -> LLM semantic score".
        # So we keep similarity separate in metrics.
        similarity_score = similarity_engine.evaluate(
            student_answer=request.student_answer,
            reference_answer="" # Reference answer not in strict request payload?
            # Wait, contract says EvaluationRequest has `question`, `student_answer`, `rubric`, `max_score`.
            # Use `question` as reference? No. 
            # If no model answer provided in request, SimilarityEngine might be less useful.
            # Assuming we skip it or pass empty.
        )
        
        # D. NLI Engine (Auxiliary metric)
        nli_score = nli_engine.evaluate(
            question=request.question,
            student_answer=request.student_answer,
            reference_answer="" # Same issue, no reference in contract
        )
        
        # E. LLM Judge (Conceptual, Clarity, Handling Incorrect)
        llm_judge = LLMJudge()
        llm_result = llm_judge.evaluate(
            question=request.question,
            student_answer=request.student_answer,
            rubric=request.rubric.model_dump(), # Pass dict representation
            max_score=request.max_score
        )
        
        # 3️⃣ Aggregation
        breakdown = RubricBreakdown(
            conceptual_understanding=llm_result["conceptual_understanding"],
            language_clarity=llm_result["language_clarity"],
            answer_completeness=descriptive_metrics["answer_completeness"],
            spelling_accuracy=spelling_score,
            handling_incorrect=llm_result["handling_incorrect"],
            effort_bonus=descriptive_metrics["effort_bonus"]
        )
        
        aggregated = aggregator.aggregate(
            breakdown=breakdown,
            weights=request.rubric,
            max_score=request.max_score
        )
        
        # 4️⃣ Response
        return EvaluationResponse(
            final_score=aggregated["final_score"],
            percentage=aggregated["percentage"],
            grade=aggregated["grade"],
            feedback=llm_result.get("feedback", "No feedback provided."),
            rubric_breakdown=breakdown,
            metrics=Metrics(
                llm=llm_result["conceptual_understanding"], # approximate
                nli=nli_score,
                similarity=similarity_score
            ),
            confidence=llm_result["confidence"]
        )

    except Exception as e:
        logger.error(f"❌ ENGINE ERROR: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
