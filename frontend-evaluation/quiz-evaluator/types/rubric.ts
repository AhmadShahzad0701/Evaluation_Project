export type MarkingScheme = {
  id: string;
  label: string;
  probability: number;
};

export type QuestionRubric = {
  questionNo: number;
  questionText: string;
  studentAnswer: string;
  type: "scheme" | "custom";
  schemes?: MarkingScheme[];
  customText?: string;
};
