import re
from typing import Optional


class SimilarityEngine:
    """
    Heuristic-based semantic similarity engine (mock).
    Produces a stable score between 0.0 and 1.0.
    """

    def _normalize(self, text: str) -> set:
        """
        Basic text normalization:
        - lowercase
        - remove punctuation
        - split into tokens
        """
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", "", text)
        return set(text.split())

    def evaluate(
        self,
        student_answer: str,
        reference_answer: Optional[str]
    ) -> float:
        """
        Returns a similarity score between 0 and 1.
        """

        if not student_answer or student_answer.strip() == "":
            return 0.0

        if not reference_answer:
            return 0.5  # neutral similarity if no reference exists

        student_tokens = self._normalize(student_answer)
        reference_tokens = self._normalize(reference_answer)

        if not student_tokens or not reference_tokens:
            return 0.0

        intersection = student_tokens.intersection(reference_tokens)
        union = student_tokens.union(reference_tokens)

        similarity_score = len(intersection) / len(union)
        return round(similarity_score, 2)
