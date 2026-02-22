import re
from typing import Dict

class DepthEstimator:
    """
    Layer 1: Deterministic Depth Heuristic.
    Calculates if the implementation meets the 'expected depth'
    based on the total marks awarded.
    """

    def estimate(self, answer: str, total_marks: float) -> Dict[str, float]:
        """
        Returns a dict with:
        - expected_points: how many concepts/sentences expected
        - actual_points: estimated count in answer
        - depth_score: 0.0 - 1.0 ratio
        """
        
        # 1. Determine Expectations
        if total_marks <= 2:
            expected_points = 1  # Definition only
        elif total_marks <= 5:
            expected_points = 2  # Definition + Explanation
        elif total_marks <= 10:
            expected_points = 3  # Structured explanation
        else:
            expected_points = 4  # Detailed analysis

        # 2. Estimate Actual Depth (Heuristic)
        # We count "meaningful segments" (sentences or bullet points)
        # This is a loose heuristic to signal the LLM.
        
        # Split by sentence terminators or newlines
        segments = re.split(r'[.!?\n;]+', answer)
        
        # Filter for segments with at least 3 words to count as a "point"
        meaningful_segments = [
            s for s in segments 
            if len(s.strip().split()) >= 3
        ]
        
        actual_points = len(meaningful_segments)
        
        # 3. Calculate Score (Capped at 1.0)
        if expected_points == 0:
            score = 1.0
        else:
            score = min(actual_points / expected_points, 1.0)

        # Bonus: specific connector words suggest reasoning (e.g. "because", "therefore")
        # Adds slightly to depth score if present, to reward complexity.
        connectors = ["because", "therefore", "however", "additionally", "firstly", "contrast"]
        has_connectors = any(c in answer.lower() for c in connectors)
        
        if has_connectors and score < 1.0:
            score = min(score + 0.1, 1.0)

        return {
            "expected_depth": float(expected_points),
            "actual_depth_heuristic": float(actual_points),
            "depth_score": round(score, 2)
        }
