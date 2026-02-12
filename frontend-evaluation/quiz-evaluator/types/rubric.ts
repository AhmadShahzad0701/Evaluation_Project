export type RubricWeight = {
  conceptual_understanding: number;
  language_clarity: number;
  answer_completeness: number;
  spelling_accuracy: number;
  handling_incorrect: number;
  effort_bonus: number;
};

export type QuestionRubric = {
  questionNo: number;
  questionText: string;
  studentAnswer: string;
  rubric: RubricWeight;
};
