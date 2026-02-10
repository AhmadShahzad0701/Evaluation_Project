from .client import LLMClient
from .prompts import EVALUATION_PROMPT


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

        raw_score = float(parsed.get("score", max_score / 2))
        normalized_score = max(0.0, min(raw_score / max_score, 1.0))

        return {
            "score": normalized_score,
            "justification": parsed.get("justification", ""),
            "weight_adjustment": parsed.get("weight_adjustment", {})
        }
