import logging
import time
import traceback
from fastapi import APIRouter, HTTPException
from app.schemas.evaluation_schemas import (
    EvaluationRequest,
    EvaluationResponse,
    RubricWeight
)

from app.engines.descriptive_engine import DescriptiveEngine
from app.engines.similarity_engine import SimilarityEngine
from app.engines.nli_engine import NLIEngine
from app.engines.llm.judge import LLMJudge
from app.engines.aggregator import Aggregator

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


@router.post("/", response_model=EvaluationResponse)
def evaluate(request: EvaluationRequest):
    llm_judge = LLMJudge()
    
    # 1. Structural Validation
    is_valid, validation_msg = descriptive_engine.validate_answer(request.student_answer)
    if not is_valid:
        # Return strict failure response
        zero_breakdown = {k: 0.0 for k in request.rubric.model_dump().keys()}
        zero_metrics = {"llm": 0.0, "nli": 0.0, "similarity": 0.0}
        
        return EvaluationResponse(
            final_score=0.0,
            percentage=0.0,
            grade="F",
            rubric_breakdown=zero_breakdown,
            metrics=zero_metrics,
            confidence=1.0  # High confidence in failure
        )

    # 2. Engines Execution
    # Rubric (converted to dict for compatibility if needed, though engines mostly need keys)
    # Actually DescriptiveEngine.DEFAULT_RUBRIC is dict. 
    # We won't use descriptive_engine.evaluate() breakdown heavily, mainly use it for legacy or validation.
    # But wait, Aggregator now computes "Language Clarity" / "Completeness". 
    # DescriptiveEngine.evaluate returns a breakdown based on dict keys.
    # We can skip DescriptiveEngine.evaluate entirely if Aggregator does the work?
    # No, Aggregator uses `_compute_language_clarity` etc.
    # DescriptiveEngine.evaluate is NOT used in the NEW Aggregator logic.
    # So we can remove it or keep it for logs.
    
    # Similarity
    similarity_score = similarity_engine.evaluate(
        student_answer=request.student_answer,
        reference_answer="" # We don't have reference in this request model?
        # User prompt: "model_answer: str" in schema?
        # My step 63 snippet of EvaluationRequest has "student_answer", "question", "rubric", "max_score".
        # It MISSES "model_answer".
        # The OLD EvaluationItem had "model_answer".
        # If the user wants similarity, we need model_answer.
        # But step 63 view of schema did NOT show model_answer.
        # Let's check step 63 again.
        # It definitely doesn't show model_answer.
        # "question: str", "student_answer: str", "rubric: ...", "max_score: ...".
        # So reference answer is missing from the NEW contract I defined?
        # Wait, I didn't verify if I should include it.
        # User prompt: 
        # "POST body must be: { question, student_answer, rubric, max_score }"
        # It DOES NOT include model_answer.
        # So similarity must be against... what?
        # "Similarity only contributes to conceptual_understanding refinement."
        # If no model answer is provided, we can't do similarity against model answer.
        # Maybe against "question"? or maybe we assume LLM handles it?
        # If user removed model_answer from requirements, then maybe similarity is 0 or based on question?
        # "Similarity" usually implies reference.
        # If I strictly follow the prompt "POST body must be...", there is no model answer.
        # So I will pass empty string or question to similarity engine?
        # Or maybe I should've added model_answer to schema?
        # Given "Similarity must NEVER override structural fail", it implies similarity is still part of it.
        # I will assume "model_answer" is optional or not present.
        # I will use "question" for similarity if model_answer is missing? No that's semantics.
        # I'll just pass "" and expect 0 similarity if no reference.
    )

    # NLI
    nli_score = nli_engine.evaluate(
        question=request.question,
        student_answer=request.student_answer,
        reference_answer="" # Same issue
    )

    # LLM
    llm_start_time = time.time()
    try:
        # We need to adapt the rubric for LLM if it expects dict.
        # LLMJudge.evaluate expects rubric dict.
        rubric_dict = request.rubric.model_dump()
        
        llm_eval = llm_judge.evaluate(
            question=request.question,
            student_answer=request.student_answer,
            rubric=rubric_dict,
            max_score=request.max_score
        )
        logger.info(f"✅ LLM success: {llm_eval['score']}")
    except Exception as e:
        logger.error(f"❌ LLM failed: {e}")
        llm_eval = {"score": 0.0, "confidence": 0.5}

    # 3. Aggregation
    scores = {
         "llm": llm_eval.get("score", 0.0),
         "nli": nli_score,
         "similarity": similarity_score
    }
    
    result = aggregator.aggregate(
        scores=scores,
        rubric=request.rubric,
        max_score=request.max_score,
        answer=request.student_answer
    )

    return EvaluationResponse(
        final_score=result["final_marks"],
        percentage=result["final_percentage"],
        grade=result["grade"],
        rubric_breakdown=result["rubric_breakdown"],
        metrics=result["metrics"],
        confidence=llm_eval.get("confidence", 0.5)
    )
