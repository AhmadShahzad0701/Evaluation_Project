from app.engines.llm.client import LLMClient
from app.engines.llm.prompts import EVALUATION_PROMPT


class LLMJudge:
    def __init__(self):
        # ✅ same model, no change
        self.model = "openai/gpt-4o-mini"
        self.client = LLMClient(model=self.model)

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

    def evaluate(self, question, student_answer, rubric, max_score):
        prompt = self._build_prompt(
            question, student_answer, rubric, max_score
        )

        parsed = self.client.send_prompt(prompt)

        # Extract component scores (default to 0.0 if missing)
        conceptual = float(parsed.get("conceptual_understanding", 0.0))
        clarity = float(parsed.get("language_clarity", 0.0))
        handling = float(parsed.get("handling_incorrect", 0.0))
        confidence = float(parsed.get("confidence", 0.5))

        # Clamp values 0.0 - 1.0
        conceptual = max(0.0, min(conceptual, 1.0))
        clarity = max(0.0, min(clarity, 1.0))
        handling = max(0.0, min(handling, 1.0))

        return {
            "conceptual_understanding": conceptual,
            "language_clarity": clarity,
            "handling_incorrect": handling,
            "feedback": parsed.get("feedback", "No feedback provided."),
            "confidence": confidence
        }
