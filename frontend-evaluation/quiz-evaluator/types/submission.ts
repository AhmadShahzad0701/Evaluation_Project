export type EvaluationSubmission = {
  quizTitle: string;
  questions: {
    questionNo: number;
    questionText: string;
    studentAnswer: string;
    rubricType: "scheme" | "custom";
    schemes?: {
      label: string;
      probability: number;
    }[];
    customRubric?: string;
  }[];
};
