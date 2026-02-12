export type RubricWeight = {
  conceptual_understanding: number;
  completeness_length: number;
  language_clarity: number;
};

export type QuestionRubric = {
  questionNo: number;
  questionText: string;
  studentAnswer: string;
  max_marks: number;
  rubric: RubricWeight;
};
