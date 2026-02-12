from app.schemas.evaluation_schemas import (
    EvaluationRequest,
    EvaluationResponse,
    RubricBreakdown,
    RubricWeight,
    Metrics
)
from app.engines.validator import Validator
from app.engines.llm.judge import LLMJudge
from app.engines.aggregator import Aggregator
from app.engines.spelling_engine import SpellingEngine
from app.engines.nli_engine import NLIEngine
from app.engines.similarity_engine import SimilarityEngine
from app.engines.descriptive_engine import DescriptiveEngine
import logging

logger = logging.getLogger(__name__)

class EvaluationService:
    """
    Central orchestration service for evaluating student answers.
    Enforces strict validation, rubric filtering, and score aggregation.
    """
    def __init__(self):
        self.validator = Validator()
        self.llm_judge = LLMJudge()
        self.aggregator = Aggregator()
        self.spelling_engine = SpellingEngine()
        self.nli_engine = NLIEngine()
        self.similarity_engine = SimilarityEngine()
        self.descriptive_engine = DescriptiveEngine()

    def evaluate_student_answer(self, request: EvaluationRequest) -> EvaluationResponse:
        """
        Orchestrates the entire evaluation pipeline.
        """
        # 1. Strict Validation (Pre-LLM)
        is_valid, validation_msg = self.validator.validate(request.student_answer)
        if not is_valid:
            logger.info(f"Validation failed: {validation_msg}")
            return self._create_zero_response(validation_msg, request.rubric)

        # 2. Rubric Processing & Zero-Weight Filtering (Early Exit)
        rubric_dict = request.rubric.model_dump()
        active_rubric = {k: v for k, v in rubric_dict.items() if v > 0}
        
        # If NO active rubric items (all weights 0), skip EVERYTHING
        if not active_rubric:
            logger.info("All rubric weights are 0. Skipping Engines & LLM.")
            return self._create_zero_response("No active rubric weights.", request.rubric)

        # 3. Auxiliary Engines (Diagnostics Only - NLI/Similarity/Spelling)
        nli_score = self.nli_engine.evaluate(request.question, request.student_answer, "")
        similarity_score = self.similarity_engine.evaluate(request.student_answer, "")
        
        # 4. LLM Evaluation
        # We pass ONLY the active rubric to the prompt
        try:
            llm_result = self.llm_judge.evaluate(
                question=request.question,
                student_answer=request.student_answer,
                rubric=active_rubric,
                max_score=request.max_score
            )
        except Exception as e:
            logger.error(f"LLM Evaluation failed: {e}")
            return self._create_zero_response(f"Evaluation Error: {str(e)}", request.rubric)

        # 5. Construct Breakdown
        # Maps LLM output directly to breakdown.
        # Fallback to 0.0 if not present (which implies it was 0-weight and not asked for, or LLM missed it)
        
        breakdown = RubricBreakdown(
            conceptual_understanding=llm_result.get("conceptual_understanding", 0.0),
            completeness_length=llm_result.get("answer_completeness", 0.0), # mapped from prompt's "answer_completeness"
            language_clarity=llm_result.get("language_clarity", 0.0)
        )

        # 6. Aggregation
        aggregated = self.aggregator.aggregate(
            breakdown=breakdown,
            weights=request.rubric,
            max_score=request.max_score
        )

        return EvaluationResponse(
            final_score=aggregated["final_score"],
            percentage=aggregated["percentage"],
            grade=aggregated["grade"],
            feedback=llm_result.get("feedback", "No feedback provided."),
            rubric_breakdown=breakdown,
            metrics=Metrics(
                llm=llm_result.get("conceptual_understanding", 0.0),
                nli=nli_score,
                similarity=similarity_score
            ),
            confidence=llm_result.get("confidence", 1.0)
        )

    def _create_zero_response(self, reason: str, rubric: RubricWeight) -> EvaluationResponse:
        """
        Helper to return a clean 0-score response.
        """
        zero_breakdown = RubricBreakdown(
            conceptual_understanding=0.0,
            completeness_length=0.0,
            language_clarity=0.0
        )
        
        return EvaluationResponse(
            final_score=0.0,
            percentage=0.0,
            grade="F",
            feedback=reason,
            rubric_breakdown=zero_breakdown,
            metrics=Metrics(llm=0.0, nli=0.0, similarity=0.0),
            confidence=1.0
        )
