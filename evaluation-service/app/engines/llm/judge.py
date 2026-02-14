from app.engines.llm.client import LLMClient
from app.engines.llm.prompts import EVALUATION_PROMPT, ADAPTIVE_EVALUATION_PROMPT


class LLMJudge:
    def __init__(self):
        # ✅ same model, no change
        self.model = "openai/gpt-4o-mini"
        self.client = LLMClient(model=self.model)

    def _build_prompt(self, question, student_answer, rubric, max_score):
        rubric_lines = (
            "General accuracy and completeness"
            if not rubric
            else "\n".join([f"- {k}: {v} marks" for k, v in rubric.items()])
        )

        return EVALUATION_PROMPT.format(
            question=question,
            student_answer=student_answer,
            rubric=rubric_lines,
            max_score=max_score
        )

    async def evaluate(self, question, student_answer, rubric, max_score):
        prompt = self._build_prompt(
            question, student_answer, rubric, max_score
        )

        parsed = await self.client.send_prompt(prompt)

        # Extract component scores (default to 0.0 if missing)
        conceptual = float(parsed.get("conceptual_understanding", 0.0))
        clarity = float(parsed.get("language_clarity", 0.0))
        handling = float(parsed.get("handling_incorrect", 0.0))
        confidence = float(parsed.get("confidence", 0.5))

        # Clamp values 0.0 - 1.0
        conceptual = max(0.0, min(conceptual, 1.0))
        clarity = max(0.0, min(clarity, 1.0))
        handling = max(0.0, min(handling, 1.0))

        return {
            "conceptual_understanding": conceptual,
            "language_clarity": clarity,
            "handling_incorrect": handling,
            "feedback": parsed.get("feedback", "No feedback provided."),
            "confidence": confidence
        }

    def _build_adaptive_prompt(self, question, student_answer, rubric_weights, total_marks, style, signals):
        # Format rubric weights for display
        rubric_lines = "\n".join([f"- {k}: {v}" for k, v in rubric_weights.items()])
        
        # Unpack signals
        sim_val = signals.get("similarity", 0.0)
        nli_val = signals.get("nli", 0.0)
        depth_val = signals.get("depth", {}).get("depth_score", 0.0)

        return ADAPTIVE_EVALUATION_PROMPT.format(
            question=question,
            student_answer=student_answer,
            rubric_weights=rubric_lines,
            total_marks=total_marks,
            style=style,
            sim_score=sim_val,
            nli_score=nli_val,
            depth_score=depth_val
        )

    async def evaluate_adaptive(self, question, student_answer, rubric_weights, total_marks, style, signals):
        prompt = self._build_adaptive_prompt(
            question, student_answer, rubric_weights, total_marks, style, signals
        )
        
        parsed = await self.client.send_prompt(prompt)
        
        # Extract new keys
        concept = float(parsed.get("concept", 0.0))
        completeness = float(parsed.get("completeness", 0.0))
        clarity = float(parsed.get("clarity", 0.0))
        
        return {
            "concept": max(0.0, min(concept, 1.0)),
            "completeness": max(0.0, min(completeness, 1.0)),
            "clarity": max(0.0, min(clarity, 1.0)),
            "feedback": parsed.get("feedback", "No feedback provided."),
            "confidence": 1.0 # Placeholder for now
        }
