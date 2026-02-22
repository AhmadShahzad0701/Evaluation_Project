from app.engines.llm.client import LLMClient
from app.engines.llm.prompts import (
    EVALUATION_PROMPT,
    ADAPTIVE_EVALUATION_PROMPT,
    BALANCED_TEACHER_PROMPT,
)


class LLMJudge:
    def __init__(self):
        self.model  = "openai/gpt-4o-mini"
        self.client = LLMClient(model=self.model)

    # ─────────────────────────────────────────────────────────────────────
    # Legacy: original evaluation (kept for backward compatibility)
    # ─────────────────────────────────────────────────────────────────────
    def _build_prompt(self, question, student_answer, rubric, max_score):
        rubric_lines = (
            "General accuracy and completeness"
            if not rubric
            else "\n".join([f"- {k}: {v} marks" for k, v in rubric.items()])
        )
        return EVALUATION_PROMPT.format(
            question=question,
            student_answer=student_answer,
            rubric=rubric_lines,
            max_score=max_score
        )

    async def evaluate(self, question, student_answer, rubric, max_score):
        prompt = self._build_prompt(question, student_answer, rubric, max_score)
        parsed = await self.client.send_prompt(prompt)

        conceptual = float(parsed.get("conceptual_understanding", 0.0))
        clarity    = float(parsed.get("language_clarity", 0.0))
        handling   = float(parsed.get("handling_incorrect", 0.0))
        confidence = float(parsed.get("confidence", 0.5))

        return {
            "conceptual_understanding": max(0.0, min(conceptual, 1.0)),
            "language_clarity":         max(0.0, min(clarity, 1.0)),
            "handling_incorrect":       max(0.0, min(handling, 1.0)),
            "feedback":                 parsed.get("feedback", "No feedback provided."),
            "confidence":               confidence,
        }

    # ─────────────────────────────────────────────────────────────────────
    # Adaptive evaluation (original pipeline; still used as fallback)
    # ─────────────────────────────────────────────────────────────────────
    def _build_adaptive_prompt(self, question, student_answer, rubric_weights,
                               total_marks, style, signals):
        rubric_lines = "\n".join([f"- {k}: {v}" for k, v in rubric_weights.items()])
        sim_val   = signals.get("similarity", 0.0)
        nli_val   = signals.get("nli", 0.0)
        depth_val = signals.get("depth", {}).get("depth_score", 0.0)

        return ADAPTIVE_EVALUATION_PROMPT.format(
            question=question,
            student_answer=student_answer,
            rubric_weights=rubric_lines,
            total_marks=total_marks,
            style=style,
            sim_score=sim_val,
            nli_score=nli_val,
            depth_score=depth_val,
        )

    async def evaluate_adaptive(self, question, student_answer, rubric_weights,
                                total_marks, style, signals):
        prompt = self._build_adaptive_prompt(
            question, student_answer, rubric_weights, total_marks, style, signals
        )
        parsed = await self.client.send_prompt(prompt)

        return {
            "concept":      max(0.0, min(float(parsed.get("concept", 0.0)),      1.0)),
            "completeness": max(0.0, min(float(parsed.get("completeness", 0.0)), 1.0)),
            "clarity":      max(0.0, min(float(parsed.get("clarity", 0.0)),      1.0)),
            "feedback":     parsed.get("feedback", "No feedback provided."),
            "confidence":   1.0,
        }

    # ─────────────────────────────────────────────────────────────────────
    # ★ NEW: Balanced Teacher evaluation
    # ─────────────────────────────────────────────────────────────────────
    def _build_balanced_prompt(self, question, student_answer, reference_answer,
                               total_marks, similarity_band, signals):
        sim_val   = signals.get("similarity", 0.0)
        nli_val   = signals.get("nli", 0.0)
        depth_val = signals.get("depth", {}).get("depth_score", 0.0)

        return BALANCED_TEACHER_PROMPT.format(
            question=question,
            student_answer=student_answer,
            reference_answer=reference_answer or "Not provided",
            total_marks=total_marks,
            similarity_band=similarity_band,
            sim_score=sim_val,
            nli_score=nli_val,
            depth_score=depth_val,
        )

    async def evaluate_balanced(
        self,
        question: str,
        student_answer: str,
        reference_answer: str | None,
        total_marks: float,
        similarity_band: str,
        signals: dict,
    ) -> dict:
        """
        Balanced Teacher pipeline evaluation.

        Returns the same key schema as evaluate_adaptive() so the rest of the
        pipeline does not need to change.

        Post-processing overrides applied here (in code, not only in the prompt)
        to guarantee correctness even if the LLM drifts:
          • If similarity_band == "Full": concept = max(concept, 0.85)
          • If similarity_band == "Noise" and word-count ≤ 3: concept = 0.0
            (ambiguous single-word answer that didn't match any reference)
        """
        prompt = self._build_balanced_prompt(
            question, student_answer, reference_answer,
            total_marks, similarity_band, signals
        )
        parsed = await self.client.send_prompt(prompt)

        concept      = max(0.0, min(float(parsed.get("concept",      0.0)), 1.0))
        completeness = max(0.0, min(float(parsed.get("completeness", 0.0)), 1.0))
        clarity      = max(0.0, min(float(parsed.get("clarity",      0.0)), 1.0))
        feedback     = parsed.get("feedback", "No feedback provided.")

        # ── Guardrail: Full-band entities must always clear 0.85 concept ───
        # and 0.70 clarity. A correct one-word answer like "Islamabad" must
        # never be penalised for lacking sentence structure.
        # Formula floor: (0.85 × 0.8) + (0.70 × 0.2) = 0.82 → 82% minimum.
        # With concept=1.0: (1.0 × 0.8) + (0.70 × 0.2) = 0.94 → 94%.
        word_count = len(student_answer.strip().split())
        if similarity_band == "Full":
            concept = max(concept, 0.85)
            if word_count <= 3:
                # Short correct answers get a clarity floor (they're precise,
                # not verbose — that's a virtue in Quizora, not a flaw).
                clarity = max(clarity, 0.70)

        # ── Guardrail: Noise + very short answer → no concept credit ──────
        if similarity_band == "Noise" and word_count <= 3:
            concept = 0.0

        return {
            "concept":      concept,
            "completeness": completeness,
            "clarity":      clarity,
            "feedback":     feedback,
            "confidence":   1.0,
        }
