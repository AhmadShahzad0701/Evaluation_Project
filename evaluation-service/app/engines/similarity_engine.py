from typing import Optional, Tuple
from sentence_transformers import SentenceTransformer
import numpy as np
from numpy.linalg import norm


# --- Threshold Constants ---
NOISE_THRESHOLD = 0.3   # Below this → treat as irrelevant noise
FULL_THRESHOLD  = 0.7   # Above this → high-confidence semantic match


class SimilarityEngine:
    """
    Semantic similarity engine using MiniLM embeddings.
    Returns both a raw score (0.0-1.0) and a band label (Noise/Partial/Full).

    Thresholds (Balanced Teacher):
        < 0.30  → Noise   (0 marks signal)
        0.30-0.70 → Partial (partial credit possible)
        > 0.70  → Full    (full conceptual credit)
    """

    def __init__(self):
        # Lightweight, fast, production-friendly
        self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    def _cosine_similarity(self, vec1, vec2) -> float:
        if norm(vec1) == 0 or norm(vec2) == 0:
            return 0.0
        return float(np.dot(vec1, vec2) / (norm(vec1) * norm(vec2)))

    def classify(self, score: float) -> str:
        """
        Maps a raw similarity score to a band label.
        """
        if score >= FULL_THRESHOLD:
            return "Full"
        if score >= NOISE_THRESHOLD:
            return "Partial"
        return "Noise"

    def evaluate(
        self,
        student_answer: str,
        reference_answer: Optional[str]
    ) -> float:
        """
        Returns semantic similarity score between 0.0 and 1.0.
        (Kept for backward compatibility — use evaluate_with_band() in
        the Balanced Teacher pipeline.)
        """
        score, _ = self.evaluate_with_band(student_answer, reference_answer)
        return score

    def evaluate_with_band(
        self,
        student_answer: str,
        reference_answer: Optional[str]
    ) -> Tuple[float, str]:
        """
        Returns (score: float, band: str) — the primary method for the
        Balanced Teacher pipeline.

        Rules (in priority order):
        1. Empty student answer  → (0.0, "Noise")
        2. No reference provided → (0.5, "Partial") fallback
        3. Exact-match override  → (1.0, "Full") — bypasses all vector checks.
           Prevents legitimate single-word answers ("Islamabad") from being
           downgraded due to embedding space quirks.
        4. Vector cosine + banding
        """
        if not student_answer or student_answer.strip() == "":
            return 0.0, "Noise"

        if not reference_answer:
            return 0.5, "Partial"  # backward-compatible neutral fallback

        student_clean   = student_answer.strip().lower()
        reference_clean = reference_answer.strip().lower()

        # ── Rule 3: Exact-match override ──────────────────────────────────────
        # Case-insensitive exact equality OR the student answer is a clean
        # exact token found inside the reference answer (e.g. the reference
        # says "Islamabad is the capital" and student says "Islamabad").
        if student_clean == reference_clean:
            return 1.0, "Full"

        # Token-level containment: every word in the student answer appears
        # verbatim in the reference (handles "The city of Islamabad" → "Full")
        student_tokens    = set(student_clean.split())
        reference_tokens  = set(reference_clean.split())
        # All student tokens found in reference AND student is ≤ 4 words
        if student_tokens and student_tokens.issubset(reference_tokens) and len(student_tokens) <= 4:
            return 1.0, "Full"

        # ── Rule 4: Vector cosine similarity ─────────────────────────────────
        embeddings = self.model.encode(
            [student_answer, reference_answer],
            convert_to_numpy=True
        )
        similarity_score = self._cosine_similarity(embeddings[0], embeddings[1])

        # Normalize from [-1,1] to [0,1]
        similarity_score = (similarity_score + 1) / 2
        similarity_score = round(float(similarity_score), 3)

        band = self.classify(similarity_score)

        # Apply Noise floor — suppress scores below threshold
        if band == "Noise":
            similarity_score = 0.0

        return similarity_score, band
