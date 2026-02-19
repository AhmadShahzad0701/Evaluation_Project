from typing import Optional
from sentence_transformers import SentenceTransformer
import numpy as np
from numpy.linalg import norm

class SimilarityEngine:
    """
    Semantic similarity engine using MiniLM embeddings.
    Uses cosine similarity between sentence embeddings.
    """

    def __init__(self):
        # Lightweight, fast, production-friendly
        self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    def _cosine_similarity(self, vec1, vec2) -> float:
        if norm(vec1) == 0 or norm(vec2) == 0:
            return 0.0
        return float(np.dot(vec1, vec2) / (norm(vec1) * norm(vec2)))

    def evaluate(
        self,
        student_answer: str,
        reference_answer: Optional[str]
    ) -> float:
        """
        Returns semantic similarity score between 0.0 and 1.0
        """

        if not student_answer or student_answer.strip() == "":
            return 0.0

        if not reference_answer:
            return 0.5  # fallback neutral behavior (backward compatible)

        embeddings = self.model.encode(
            [student_answer, reference_answer],
            convert_to_numpy=True
        )

        similarity_score = self._cosine_similarity(
            embeddings[0], embeddings[1]
        )

        # Normalize from [-1,1] to [0,1] just in case
        similarity_score = (similarity_score + 1) / 2

        return round(float(similarity_score), 3)
