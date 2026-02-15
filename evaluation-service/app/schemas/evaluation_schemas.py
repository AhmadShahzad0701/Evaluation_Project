from pydantic import BaseModel
from typing import Dict, List, Optional

class RubricWeight(BaseModel):
    # Support for legacy 6-key schema (mappings will be handled in service)
    conceptual_understanding: Optional[float] = None
    language_clarity: Optional[float] = None
    answer_completeness: Optional[float] = None
    spelling_accuracy: Optional[float] = None
    handling_incorrect: Optional[float] = None
    effort_bonus: Optional[float] = None

    # New 3-key adaptive schema
    concept: Optional[float] = None
    completeness: Optional[float] = None
    clarity: Optional[float] = None

class EvaluationRequest(BaseModel):
    question: str
    student_answer: str
    rubric: RubricWeight
    max_score: float = 10.0
    total_marks: Optional[float] = None # Overrides max_score if present
    evaluation_style: str = "balanced" # balanced | concept-focused | strict
    reference_answer: Optional[str] = None

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
