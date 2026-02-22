from app.schemas.evaluation_schemas import RubricBreakdown, RubricWeight

class Aggregator:
    """
    Pure Aggregation Logic.
    Calculates final score based on rubric weights.
    """

    def aggregate(
        self,
        breakdown: RubricBreakdown,
        weights: RubricWeight,
        max_score: float
    ) -> dict:
        """
        Legacy aggregation (fallback).
        Not used by clean EvaluationService, but kept for safety if imported elsewhere.
        """
        # Best effort mapping if using legacy breakdown
        numerator = 0.0
        total_weight = 0.0

        # Attempt to sum whatever keys exist and match
        # This is brittle, but adaptive path is preferred.
        return self._finalize_score(0.0, 1.0, max_score) # Dummy fallback

    def aggregate_adaptive(self, breakdown: RubricBreakdown, weights: dict, total_marks: float) -> dict:
        """
        Adaptive aggregation using normalized keys.
        formula: (concept * w_c + completeness * w_comp + clarity * w_cl) / sum(w) * total_marks
        """
        # Extract weights (default to 0.0)
        w_concept = weights.get("concept", 0.0)
        w_completeness = weights.get("completeness", 0.0)
        w_clarity = weights.get("clarity", 0.0)

        # Calculate numerator
        # Breakdown keys must match what EvaluationService populates
        # breakdown.conceptual_understanding -> concept
        # breakdown.completeness_length -> completeness
        # breakdown.language_clarity -> clarity
        
        numerator = (
            breakdown.conceptual_understanding * w_concept +
            breakdown.completeness_length * w_completeness +
            breakdown.language_clarity * w_clarity
        )
        
        total_weight = w_concept + w_completeness + w_clarity
        
        return self._finalize_score(numerator, total_weight, total_marks)

    def _finalize_score(self, numerator, total_weight, max_score):
        # Avoid division by zero
        if total_weight == 0:
            final_score = 0.0
        else:
            final_score = numerator / total_weight
            
        final_absolute = final_score * max_score
        
        # Rounding for cleanliness
        final_absolute = round(final_absolute, 2)
        percentage = round(final_score * 100, 2)
        
        # Assign Grade
        if percentage >= 90: grade = "A"
        elif percentage >= 80: grade = "B"
        elif percentage >= 70: grade = "C"
        elif percentage >= 60: grade = "D"
        else: grade = "F"
        
        return {
            "final_score": final_absolute,
            "percentage": percentage,
            "grade": grade,
            "confidence": 1.0 # Aggregation is deterministic
        }
