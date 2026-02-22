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
from app.engines.depth_estimator import DepthEstimator
import logging

logger = logging.getLogger(__name__)

class EvaluationService:
    """
    Central orchestration service for evaluating student answers.
    Implements 3-Layer Adaptive Pipeline:
    1. Deterministic (Validator + Depth)
    2. Signals (Similarity + NLI)
    3. Reasoning (LLM)
    """
    def __init__(self):
        self.validator = Validator()
        self.llm_judge = LLMJudge()
        self.aggregator = Aggregator()
        self.spelling_engine = SpellingEngine()
        self.nli_engine = NLIEngine()
        self.similarity_engine = SimilarityEngine()
        self.descriptive_engine = DescriptiveEngine()
        self.depth_estimator = DepthEstimator()

    async def evaluate_student_answer(self, request: EvaluationRequest) -> EvaluationResponse:
        """
        Orchestrates the entire evaluation pipeline.
        """
        # 0. Normalization & Context Setup
        total_marks = request.total_marks if request.total_marks is not None else request.max_score
        normalized_rubric = self._normalize_rubric(request.rubric)
        
        # 1. Layer 1: Deterministic Checks & Depth
        # Adaptive Validation: Pass total_marks to validator
        is_valid, validation_msg = self.validator.validate_adaptive(request.student_answer, total_marks)
        
        if not is_valid:
            logger.info(f"Validation failed: {validation_msg}")
            return self._create_zero_response(validation_msg, normalized_rubric)

        # Depth Heuristic (Signal only)
        depth_signals = self.depth_estimator.estimate(request.student_answer, total_marks)

        # Zero-Weight Check (Early Exit)
        # Check if ALL normalized weights are 0
        if sum(normalized_rubric.values()) == 0:
             logger.info("All rubric weights are 0. Skipping Engines & LLM.")
             return self._create_zero_response("No active rubric weights.", normalized_rubric)

        # 2. Layer 2: Signal Generation (NLI, Similarity)
        # These are NOT final scores but signals for the LLM
        similarity_score = self.similarity_engine.evaluate(request.student_answer, "")
        nli_score = self.nli_engine.evaluate(request.question, request.student_answer, "")
        
        # 3. Layer 3: LLM Reasoning
        # Pass everything to LLM
        try:
            llm_result = await self.llm_judge.evaluate_adaptive(
                question=request.question,
                student_answer=request.student_answer,
                rubric_weights=normalized_rubric,
                total_marks=total_marks,
                style=request.evaluation_style,
                signals={
                    "similarity": similarity_score,
                    "nli": nli_score,
                    "depth": depth_signals
                }
            )
        except Exception as e:
            logger.error(f"LLM Evaluation failed: {e}")
            return self._create_zero_response(f"Evaluation Error: {str(e)}", normalized_rubric)

        # 4. Construct Breakdown & Aggregate
        # Map LLM outputs to our unified schema
        breakdown = RubricBreakdown(
            conceptual_understanding=llm_result.get("concept", 0.0),
            completeness_length=llm_result.get("completeness", 0.0),
            language_clarity=llm_result.get("clarity", 0.0),
            # Legacy fields zeroed out in breakdown, handled in aggregation via mapping if needed
            spelling_accuracy=0.0,
            handling_incorrect=0.0,
            effort_bonus=0.0
        )

        aggregated = self.aggregator.aggregate_adaptive(
            breakdown=breakdown,
            weights=normalized_rubric,
            total_marks=total_marks
        )

        return EvaluationResponse(
            final_score=aggregated["final_score"],
            percentage=aggregated["percentage"],
            grade=aggregated["grade"],
            feedback=llm_result.get("feedback", "No feedback provided."),
            rubric_breakdown=breakdown,
            metrics=Metrics(
                llm=llm_result.get("concept", 0.0),
                nli=nli_score,
                similarity=similarity_score
            ),
            confidence=llm_result.get("confidence", 1.0)
        )

    def _normalize_rubric(self, r: RubricWeight) -> dict:
        """
        Normalizes legacy 6-key rubric or new 3-key rubric 
        into a unified {'concept', 'completeness', 'clarity'} dict.
        """
        # If new schema is used
        if r.concept is not None or r.completeness is not None or r.clarity is not None:
             return {
                 "concept": r.concept or 0.0,
                 "completeness": r.completeness or 0.0,
                 "clarity": r.clarity or 0.0
             }
        
        # Fallback: Legacy mapping
        # Concept = conceptual + handling
        concept = (r.conceptual_understanding or 0.0) + (r.handling_incorrect or 0.0)
        
        # Completeness = completeness + effort
        completeness = (r.answer_completeness or 0.0) + (r.effort_bonus or 0.0)
        
        # Clarity = clarity + spelling
        clarity = (r.language_clarity or 0.0) + (r.spelling_accuracy or 0.0)
        
        return {
            "concept": concept,
            "completeness": completeness,
            "clarity": clarity
        }

    def _create_zero_response(self, reason: str, rubric: dict) -> EvaluationResponse:
        """
        Helper to return a clean 0-score response.
        """
        zero_breakdown = RubricBreakdown(
            conceptual_understanding=0.0,
            completeness_length=0.0,
            language_clarity=0.0,
            spelling_accuracy=0.0,
            handling_incorrect=0.0,
            effort_bonus=0.0
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
