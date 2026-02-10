"use client";

import { useState } from "react";
import { QuestionRubric } from "@/types/rubric";
import QuestionRubricCard from "./QuestionRubricCard";

export default function DynamicRubricBuilder() {
  const [questions, setQuestions] = useState<QuestionRubric[]>([
    {
      questionNo: 1,
      questionText: "",
      studentAnswer: "",
      type: "scheme",
      schemes: [],
    },
  ]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionNo: prev.length + 1,
        questionText: "",
        studentAnswer: "",
        type: "scheme",
        schemes: [],
      },
    ]);
  };

  const updateQuestion = (index: number, updated: QuestionRubric) => {
    const copy = [...questions];
    copy[index] = updated;
    setQuestions(copy);
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Question-wise Rubrics</h2>

      {questions.map((q, index) => (
        <QuestionRubricCard
          key={q.questionNo}
          data={q}
          onChange={(updated: QuestionRubric) => updateQuestion(index, updated)}
        />
      ))}

      <button
        onClick={addQuestion}
        className="px-4 py-2 rounded bg-blue-600 text-white"
      >
        + Add Question
      </button>
    </section>
  );
}
