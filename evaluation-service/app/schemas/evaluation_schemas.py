from pydantic import BaseModel
from typing import Dict, List, Optional

class RubricWeight(BaseModel):
    conceptual_understanding: float
    language_clarity: float
    answer_completeness: float
    spelling_accuracy: float
    handling_incorrect: float
    effort_bonus: float

class EvaluationRequest(BaseModel):
    question: str
    student_answer: str
    rubric: RubricWeight
    max_score: float = 10.0

class RubricBreakdown(BaseModel):
    conceptual_understanding: float
    language_clarity: float
    answer_completeness: float
    spelling_accuracy: float
    handling_incorrect: float
    effort_bonus: float

class Metrics(BaseModel):
    llm: float
    nli: float
    similarity: float

class EvaluationResponse(BaseModel):
    final_score: float
    percentage: float
    grade: str # A|B|C|D|F
    rubric_breakdown: RubricBreakdown
    metrics: Metrics
    confidence: float


