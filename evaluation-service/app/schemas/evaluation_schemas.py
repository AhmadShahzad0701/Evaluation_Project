from pydantic import BaseModel
from typing import Dict, List, Optional

class RubricWeight(BaseModel):
    conceptual_understanding: float
    completeness_length: float
    language_clarity: float

class EvaluationRequest(BaseModel):
    question: str
    student_answer: str
    rubric: RubricWeight
    max_score: float = 10.0

class RubricBreakdown(BaseModel):
    conceptual_understanding: float
    completeness_length: float
    language_clarity: float

class Metrics(BaseModel):
    llm: float
    nli: float
    similarity: float

class EvaluationResponse(BaseModel):
    final_score: float
    percentage: float
    grade: str # A|B|C|D|F
    feedback: str # New field for AI feedback
    rubric_breakdown: RubricBreakdown
    metrics: Metrics
    confidence: float
