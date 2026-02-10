from typing import Dict, Optional


class Aggregator:
    """
    Hybrid aggregator:
    - Derives deterministic base weights from rubric
    - Applies bounded LLM-assisted adjustments (optional)
    - Combines normalized scores into final percentage and marks
    """

    MAX_ADJUSTMENT = 0.1

    def derive_base_weights(self, rubric: Dict[str, int]) -> Dict[str, float]:
        total = sum(rubric.values()) if rubric else 1

        concept_weight = sum(
            v for k, v in rubric.items()
            if "concept" in k.lower() or "understanding" in k.lower()
        ) / total

        language_weight = sum(
            v for k, v in rubric.items()
            if "language" in k.lower()
            or "clarity" in k.lower()
            or "grammar" in k.lower()
        ) / total

        llm = round(0.4 + (0.2 * concept_weight), 2)
        nli = round(0.3 + (0.1 * concept_weight), 2)
        similarity = round(0.3 + (0.2 * language_weight), 2)

        s = llm + nli + similarity

        return {
            "llm": llm / s,
            "nli": nli / s,
            "similarity": similarity / s,
        }

    def apply_llm_adjustment(
        self,
        base_weights: Dict[str, float],
        llm_adjustment: Optional[Dict[str, float]],
    ) -> Dict[str, float]:

        if not llm_adjustment:
            return base_weights

        adjusted = base_weights.copy()

        for key, delta in llm_adjustment.items():
            if key in adjusted:
                bounded_delta = max(
                    -self.MAX_ADJUSTMENT,
                    min(self.MAX_ADJUSTMENT, delta),
                )
                adjusted[key] += bounded_delta

        s = sum(adjusted.values())
        return {k: v / s for k, v in adjusted.items()}

    def aggregate(
        self,
        scores: Dict[str, float],
        rubric: Dict[str, int],
        max_score: int,
        llm_adjustment: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:

        base_weights = self.derive_base_weights(rubric)
        final_weights = self.apply_llm_adjustment(
            base_weights, llm_adjustment
        )

        final_percentage = (
            scores.get("llm", 0.0) * final_weights["llm"]
            + scores.get("nli", 0.0) * final_weights["nli"]
            + scores.get("similarity", 0.0)
            * final_weights["similarity"]
        )

        final_percentage = round(
            max(0.0, min(final_percentage, 1.0)), 2
        )
        final_marks = round(final_percentage * max_score, 2)

        return {
            "final_percentage": final_percentage,
            "final_marks": final_marks,
            "weights_used": final_weights,
            "debug_signals": {
                "llm_score": scores.get("llm", 0.0),
                "nli_score": scores.get("nli", 0.0),
                "similarity_score": scores.get("similarity", 0.0),
            },
        }
