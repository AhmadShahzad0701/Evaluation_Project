from app.schemas.evaluation_schemas import RubricBreakdown, RubricWeight

class Aggregator:
    """
    Pure Aggregation Logic.
    Calculates final score based on strict rubric weights.
    """

    def aggregate(
        self,
        breakdown: RubricBreakdown,
        weights: RubricWeight,
        max_score: float
    ) -> dict:
        """
        Computes the weighted score.
        formula: sum(score_component * weight_component) / sum(weights)
        """
        
        # Calculate numerator
        numerator = (
            breakdown.conceptual_understanding * weights.conceptual_understanding +
            breakdown.language_clarity * weights.language_clarity +
            breakdown.answer_completeness * weights.answer_completeness +
            breakdown.spelling_accuracy * weights.spelling_accuracy +
            breakdown.handling_incorrect * weights.handling_incorrect +
            breakdown.effort_bonus * weights.effort_bonus
        )
        
        # Calculate denominator (sum of all weights)
        total_weight = (
            weights.conceptual_understanding +
            weights.language_clarity +
            weights.answer_completeness +
            weights.spelling_accuracy +
            weights.handling_incorrect +
            weights.effort_bonus
        )
        
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
