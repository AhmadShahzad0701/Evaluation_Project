import re
from typing import Optional


class NLIEngine:
    """
    Heuristic-based Natural Language Inference (mock).
    Estimates entailment vs contradiction between question and answer.
    Returns a score between 0.0 and 1.0.
    """

    CONTRADICTION_KEYWORDS = {
        "not", "never", "no", "incorrect", "wrong", "false", "cannot"
    }

    def _normalize(self, text: str) -> set:
        """
        Normalize text into a token set.
        """
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", "", text)
        return set(text.split())

    def evaluate(
        self,
        question: str,
        student_answer: str,
        reference_answer: Optional[str] = None
    ) -> float:
        """
        Returns an entailment score between 0.0 and 1.0.
        Higher score = logically consistent with question.
        """

        if not student_answer or student_answer.strip() == "":
            return 0.0

        question_tokens = self._normalize(question)
        answer_tokens = self._normalize(student_answer)

        # Detect explicit contradiction signals
        contradiction_hits = self.CONTRADICTION_KEYWORDS.intersection(answer_tokens)
        contradiction_penalty = 0.2 * len(contradiction_hits)

        # Logical overlap with question
        logical_overlap = len(question_tokens.intersection(answer_tokens))
        base_score = min(logical_overlap / max(len(question_tokens), 1), 1.0)

        # Optional reference answer strengthening
        if reference_answer:
            reference_tokens = self._normalize(reference_answer)
            reference_overlap = len(reference_tokens.intersection(answer_tokens))
            base_score = (base_score + (reference_overlap / max(len(reference_tokens), 1))) / 2

        final_score = base_score - contradiction_penalty
        final_score = max(0.0, min(final_score, 1.0))

        return round(final_score, 2)
