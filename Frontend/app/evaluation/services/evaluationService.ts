import axios from "axios";

/* ================= TYPES ================= */

export interface SingleEvaluation {
  student_id: string;
  question_id: string;
  question_type: "mcq" | "descriptive";
  question: string;
  student_answer: string;
  rubric: Record<string, number>;
  max_score: number;
}

export interface EvaluationRequest {
  evaluations: SingleEvaluation[];
}

export interface EvaluationResponse {
  results: {
    student_id: string;
    question_id: string;
    score: number;
    breakdown: Record<string, number>;
    feedback: string;
    confidence: number;
  }[];
}
/* ============== API CALL ============== */

export const evaluateAnswer = async (
  payload: EvaluationRequest
) => {
  const res = await axios.post(
    "http://localhost:4000/api/evaluate",
    payload
  );
  return res.data;
};
