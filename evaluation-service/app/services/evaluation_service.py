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
    Balanced Teacher Evaluation Pipeline for Quizora.

    Scoring Formula:
        Final Score = (Conceptual_Score × 0.8) + (Clarity_Score × 0.2)
        Hard rule: if Conceptual_Score == 0.0 → Final Score = 0.0

    Architecture (3 layers):
        1. Deterministic  — Validator + DepthEstimator
        2. Signal         — SimilarityEngine (with band) + NLI
        3. Reasoning      — LLMJudge.evaluate_balanced()

    Key behaviours:
        • Short, correct answers (≤ 3 words) score as well as long ones.
        • Exact entity match (e.g. "Islamabad") is never downgraded for brevity.
        • Gibberish / symbolic inputs (e.g. "123@#$") return 0.0 immediately.
        • Completeness is metadata only — does NOT affect the final score formula.
    """

    # ── Balanced Teacher weights (immutable) ─────────────────────────────────
    CONCEPT_WEIGHT = 0.8
    CLARITY_WEIGHT = 0.2

    def __init__(self):
        self.validator         = Validator()
        self.llm_judge         = LLMJudge()
        self.aggregator        = Aggregator()
        self.spelling_engine   = SpellingEngine()
        self.nli_engine        = NLIEngine()
        self.similarity_engine = SimilarityEngine()
        self.descriptive_engine = DescriptiveEngine()
        self.depth_estimator   = DepthEstimator()

    async def evaluate_student_answer(self, request: EvaluationRequest) -> EvaluationResponse:
        """
        Main orchestration method.
        """
        # ── 0. Context normalisation ─────────────────────────────────────────
        total_marks      = request.total_marks if request.total_marks is not None else request.max_score
        normalized_rubric = self._normalize_rubric(request.rubric)

        # ── 1. Layer 1a: Structural validation ───────────────────────────────
        # The enhanced Validator now catches symbolic gibberish (e.g. "123@#$")
        # BEFORE any LLM call, saving tokens and guaranteeing 0 score.
        is_valid, validation_msg = self.validator.validate_adaptive(
            request.student_answer, total_marks
        )
        if not is_valid:
            logger.info(f"Validation failed: {validation_msg}")
            return self._create_zero_response(validation_msg, normalized_rubric)

        # ── 1. Layer 1b: Depth heuristic (signal only) ──────────────────────
        depth_signals = self.depth_estimator.estimate(request.student_answer, total_marks)

        # ── Zero-weight early exit ───────────────────────────────────────────
        if sum(normalized_rubric.values()) == 0:
            logger.info("All rubric weights are 0. Skipping Engines & LLM.")
            return self._create_zero_response("No active rubric weights.", normalized_rubric)

        # ── 2. Layer 2: Signal generation ───────────────────────────────────
        reference = request.reference_answer if request.reference_answer else None

        # NEW: evaluate_with_band returns both the raw score AND the band label.
        # The band label is passed into the LLM prompt and used for guardrails.
        similarity_score, similarity_band = self.similarity_engine.evaluate_with_band(
            request.student_answer, reference
        )
        nli_score = self.nli_engine.evaluate(request.question, request.student_answer, "")

        logger.debug(
            f"Signals — similarity: {similarity_score:.3f} [{similarity_band}], "
            f"nli: {nli_score:.3f}, depth: {depth_signals.get('depth_score', 0):.3f}"
        )

        # ── Rubric normalisation (re-run to guarantee proportional weights) ──
        total_weight = sum(normalized_rubric.values())
        if total_weight > 0:
            normalized_rubric = {k: v / total_weight for k, v in normalized_rubric.items()}

        # ── 3. Layer 3: LLM Reasoning (Balanced Teacher) ────────────────────
        try:
            llm_result = await self.llm_judge.evaluate_balanced(
                question=request.question,
                student_answer=request.student_answer,
                reference_answer=reference,
                total_marks=total_marks,
                similarity_band=similarity_band,
                signals={
                    "similarity": similarity_score,
                    "nli":        nli_score,
                    "depth":      depth_signals,
                }
            )
        except Exception as e:
            logger.error(f"LLM Evaluation failed: {e}")
            return self._create_zero_response(f"Evaluation Error: {str(e)}", normalized_rubric)

        # ── 4. Score extraction ──────────────────────────────────────────────
        llm_concept      = llm_result.get("concept",      0.0)
        llm_completeness = llm_result.get("completeness", 0.0)
        llm_clarity      = llm_result.get("clarity",      0.0)

        # ── 5. Short-form answer boost ───────────────────────────────────────
        # If the student gave a ≤ 3-word answer that received a "Full" band
        # from the SimilarityEngine (exact/token match), enforce the minimum
        # conceptual score. This is a code-level guardrail complementing the
        # LLM prompt rules to handle edge cases with model drift.
        word_count = len(request.student_answer.strip().split())
        if word_count <= 3 and similarity_band == "Full":
            llm_concept = max(llm_concept, 0.85)
            logger.debug(f"Short-form boost applied: concept → {llm_concept:.3f}")

        # ── 6. Balanced Teacher formula ──────────────────────────────────────
        #
        #   Final ratio = (Concept × 0.8) + (Clarity × 0.2)
        #   Hard rule  : Concept == 0.0  →  Final = 0.0  (no mark for zero concept)
        #
        # Completeness is recorded in the breakdown for feedback/display but
        # does NOT contribute to the final score. This ensures a concise,
        # correct answer is never penalised for not being "long enough."
        if llm_concept == 0.0:
            final_ratio = 0.0
        else:
            final_ratio = (llm_concept * self.CONCEPT_WEIGHT) + (llm_clarity * self.CLARITY_WEIGHT)

        final_ratio   = max(0.0, min(final_ratio, 1.0))
        final_score   = round(final_ratio * total_marks, 2)
        percentage    = round(final_ratio * 100, 2)

        # ── 7. Grade assignment ──────────────────────────────────────────────
        grade = self._assign_grade(percentage)

        # ── 8. Construct breakdown (for display / API consumers) ─────────────
        breakdown = RubricBreakdown(
            conceptual_understanding=llm_concept,
            completeness_length=llm_completeness,   # metadata only in this model
            language_clarity=llm_clarity,
            spelling_accuracy=0.0,
            handling_incorrect=0.0,
            effort_bonus=0.0
        )

        logger.info(
            f"Balanced Teacher result | concept={llm_concept:.3f} clarity={llm_clarity:.3f} "
            f"band={similarity_band} | final={final_score}/{total_marks} ({percentage}%)"
        )

        return EvaluationResponse(
            final_score=final_score,
            percentage=percentage,
            grade=grade,
            feedback=llm_result.get("feedback", "No feedback provided."),
            rubric_breakdown=breakdown,
            metrics=Metrics(
                llm=llm_concept,
                nli=nli_score,
                similarity=similarity_score,
            ),
            confidence=llm_result.get("confidence", 1.0)
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _normalize_rubric(self, r: RubricWeight) -> dict:
        """
        Normalises legacy 6-key rubric or new 3-key rubric into
        a unified {'concept', 'completeness', 'clarity'} dict.
        """
        if r.concept is not None or r.completeness is not None or r.clarity is not None:
            return {
                "concept":      r.concept      or 0.0,
                "completeness": r.completeness or 0.0,
                "clarity":      r.clarity      or 0.0,
            }

        # Legacy fallback mapping
        concept      = (r.conceptual_understanding or 0.0) + (r.handling_incorrect or 0.0)
        completeness = (r.answer_completeness or 0.0) + (r.effort_bonus or 0.0)
        clarity      = (r.language_clarity or 0.0) + (r.spelling_accuracy or 0.0)

        return {
            "concept":      concept,
            "completeness": completeness,
            "clarity":      clarity,
        }

    def _assign_grade(self, percentage: float) -> str:
        if percentage >= 90: return "A"
        if percentage >= 80: return "B"
        if percentage >= 70: return "C"
        if percentage >= 60: return "D"
        return "F"

    def _create_zero_response(self, reason: str, rubric: dict) -> EvaluationResponse:
        """
        Returns a clean 0-score response for failed validation or errors.
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
