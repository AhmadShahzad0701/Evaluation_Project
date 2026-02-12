import { RubricWeight } from "./rubric";

export type EvaluationSubmission = {
  quizTitle: string;
  questions: {
    questionNo: number;
    questionText: string;
    studentAnswer: string;
    rubric: RubricWeight;
  }[];
};
