import re
from typing import Dict, Any, Optional
from app.schemas.evaluation_schemas import RubricWeight

class Aggregator:
    """
    Strict contract-driven aggregator.
    Maps component scores to RubricWeight categories.
    """

    def _normalize(self, val: float) -> float:
        return max(0.0, min(1.0, float(val)))

    def _compute_spelling_score(self, text: str) -> float:
        # Simple heuristic: ratio of words with alpha characters
        # In a real system, use a spellchecker library.
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text)
        if not words:
            return 1.0  # Too short to judge or only numbers
        
        # Mock implementation: assume 95% correctness for now
        # structural failures are handled before this.
        return 0.95

    def _compute_language_clarity(self, text: str) -> float:
        # Heuristic: sentence length and vocabulary diversity
        words = text.split()
        if len(words) < 5:
            return 0.5
        
        unique_ratio = len(set(words)) / len(words) if words else 0
        return self._normalize(0.5 + (unique_ratio * 0.5))

    def _compute_completeness(self, text: str) -> float:
        # Heuristic: length based (e.g., target 30-50 words for full marks)
        word_count = len(text.split())
        if word_count > 40:
            return 1.0
        return self._normalize(word_count / 40.0)

    def _compute_effort(self, text: str) -> float:
        # Bonus for formatting or length
        has_structure = '\n' in text or '-' in text or '1.' in text
        length_bonus = min(0.5, len(text.split()) / 100.0)
        return self._normalize(0.5 + (0.5 if has_structure else 0.0) + length_bonus)

    def aggregate(
        self,
        scores: Dict[str, float],
        rubric: RubricWeight,
        max_score: float,
        answer: str
    ) -> Dict[str, Any]:
        
        # 1. Map raw signals to rubric categories
        # Conceptual: blend of LLM and Similarity (LLM preferred)
        llm_score = scores.get("llm", 0.0)
        similarity_score = scores.get("similarity", 0.0)
        nli_score = scores.get("nli", 0.0)

        # Fallback logic for concept score
        if llm_score > 0:
            concept_score = llm_score
        else:
            concept_score = similarity_score

        # Component scores (0.0 to 1.0)
        components = {
            "conceptual_understanding": self._normalize(concept_score),
            "language_clarity": self._compute_language_clarity(answer),
            "answer_completeness": self._compute_completeness(answer),
            "spelling_accuracy": self._compute_spelling_score(answer),
            "handling_incorrect": self._normalize(nli_score), # Using NLI as proxy for correctness handling
            "effort_bonus": self._compute_effort(answer)
        }

        # 2. Weighted Sum
        weighted_sum = (
            components["conceptual_understanding"] * rubric.conceptual_understanding +
            components["language_clarity"] * rubric.language_clarity +
            components["answer_completeness"] * rubric.answer_completeness +
            components["spelling_accuracy"] * rubric.spelling_accuracy +
            components["handling_incorrect"] * rubric.handling_incorrect +
            components["effort_bonus"] * rubric.effort_bonus
        )

        # 3. Total Weights
        total_weight = (
            rubric.conceptual_understanding +
            rubric.language_clarity +
            rubric.answer_completeness +
            rubric.spelling_accuracy +
            rubric.handling_incorrect +
            rubric.effort_bonus
        )

        # Avoid division by zero
        if total_weight <= 0:
            final_percentage = 0.0
        else:
            final_percentage = weighted_sum / total_weight

        final_percentage = round(self._normalize(final_percentage), 4)
        final_marks = round(final_percentage * max_score, 2)

        # 4. Grade
        if final_percentage >= 0.9: grade = "A"
        elif final_percentage >= 0.8: grade = "B"
        elif final_percentage >= 0.7: grade = "C"
        elif final_percentage >= 0.6: grade = "D"
        else: grade = "F"

        return {
            "final_percentage": final_percentage,
            "final_marks": final_marks,
            "grade": grade,
            "rubric_breakdown": components, # Return the calculated component scores
            "metrics": {
                "llm": llm_score,
                "nli": nli_score,
                "similarity": similarity_score
            }
        }
