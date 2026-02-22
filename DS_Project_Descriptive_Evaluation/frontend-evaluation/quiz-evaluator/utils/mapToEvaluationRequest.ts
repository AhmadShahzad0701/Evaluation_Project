import { EvaluationSubmission } from "@/types/submission";

export function mapToEvaluationRequest(
  submission: EvaluationSubmission
) {
  return {
    evaluations: submission.questions.map((q, index) => ({
      student_id: "student_001",          // placeholder
      question_id: `Q${q.questionNo}`,
      question_type: "descriptive",
      question: q.questionText,
      student_answer: q.studentAnswer,
      model_answer: "",                   // optional (your engines handle None)
      rubric:
        q.rubricType === "scheme"
          ? Object.fromEntries(
              q.schemes!.map((s) => [
                s.label,
                s.probability,
              ])
            )
          : undefined,
      max_score: 10
    }))
  };
}
