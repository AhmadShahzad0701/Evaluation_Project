class DescriptiveEngine:
    DEFAULT_RUBRIC = {
        "Conceptual Understanding": 5,
        "Clarity": 3,
        "Completeness": 2
    }
    def evaluate(
        self,
        question: str,
        answer: str,
        rubric: dict | None,
        max_score: int
    ):
        if not answer or answer.strip() == "":
            breakdown = {}
            for key, weight in (rubric or self.DEFAULT_RUBRIC).items():
                breakdown[key] = 0
            return {
                "total_score": 0,
                "breakdown": breakdown,
                "feedback": "No answer was submitted.",
                "confidence": 0.0
            }
        active_rubric = rubric if rubric else self.DEFAULT_RUBRIC
        breakdown = {}
        total = 0
        for key, weight in active_rubric.items():
            score = int(weight * 0.6)  # placeholder logic
            breakdown[key] = score
            total += score
        total = min(total, max_score)
        return {
            "total_score": total,
            "breakdown": breakdown,
            "feedback": "Answer evaluated based on provided rubric.",
            "confidence": 0.6
        }
