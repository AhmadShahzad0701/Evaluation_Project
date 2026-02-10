"use client";

import { useState } from "react";
import { QuestionRubric } from "@/types/rubric";
import QuestionRubricCard from "./QuestionRubricCard";
import { EvaluationSubmission } from "@/types/submission";

export default function DynamicRubricBuilder() {
  const [quizTitle, setQuizTitle] = useState("");
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
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  };

  // ✅ SUBMIT HANDLER
  const handleSubmit = () => {
    // BASIC VALIDATION
    if (!quizTitle.trim()) {
      alert("Quiz title is required.");
      return;
    }

    for (const q of questions) {
      if (!q.questionText.trim()) {
        alert(`Question ${q.questionNo}: Question text is required.`);
        return;
      }

      if (!q.studentAnswer.trim()) {
        alert(`Question ${q.questionNo}: Student response is required.`);
        return;
      }

      if (q.type === "scheme") {
        const total =
          q.schemes?.reduce((sum, s) => sum + s.probability, 0) ?? 0;

        if (total !== 100) {
          alert(`Question ${q.questionNo}: Marking scheme total must be 100%.`);
          return;
        }
      }

      if (q.type === "custom" && !q.customText?.trim()) {
        alert(`Question ${q.questionNo}: Custom rubric is required.`);
        return;
      }
    }

    // FINAL PAYLOAD
    const payload: EvaluationSubmission = {
      quizTitle,
      questions: questions.map((q) => ({
        questionNo: q.questionNo,
        questionText: q.questionText,
        studentAnswer: q.studentAnswer,
        rubricType: q.type,
        schemes:
          q.type === "scheme"
            ? q.schemes?.map((s) => ({
                label: s.label,
                probability: s.probability,
              }))
            : undefined,
        customRubric: q.type === "custom" ? q.customText : undefined,
      })),
    };

    console.log("FINAL SUBMISSION PAYLOAD:", payload);

    // TEMP: show result page
    alert("Evaluation submitted successfully!");
  };

  return (
    <div className="space-y-8">
      {/* Quiz Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Quiz Title
        </label>
        <input
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          placeholder="Enter quiz title"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Questions */}
      {questions.map((q, i) => (
        <QuestionRubricCard
          key={q.questionNo}
          data={q}
          onChange={(updated) => updateQuestion(i, updated)}
        />
      ))}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={addQuestion}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          + Add Question
        </button>

        <button
          onClick={handleSubmit}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Submit Evaluation
        </button>
      </div>
    </div>
  );
}
