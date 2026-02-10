from pydantic import BaseModel
from typing import Dict, List, Optional

class EvaluationItem(BaseModel):
    student_id: Optional[str] = None
    question_id: Optional[str] = None
    question_type: str
    question: str
    student_answer: Optional[str] = ""
    model_answer: str 
    rubric: Optional[Dict[str, int]] = None
    max_score: int
class EvaluationRequest(BaseModel):
    evaluations: List[EvaluationItem]
class EvaluationResult(BaseModel):
    student_id: str
    question_id: str

    max_marks: int                 # out of how many
    obtained_marks: float          # obtained marks

    breakdown: Dict[str, int]
    feedback: str

    signals: Dict[str, float]      # model-wise scores
    confidence: float
class EvaluationResponse(BaseModel):
    results: List[EvaluationResult]

    overall_max_marks: int
    overall_obtained_marks: float

