"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { QuestionRubric } from "@/types/rubric";
import { EvaluationSubmission } from "@/types/submission";
import { mapToEvaluationRequest } from "@/utils/mapToEvaluationRequest";

import QuestionRubricCard from "./QuestionRubricCard";
import EvaluationLoader from "@/components/ui/EvaluationLoader";

// ⏱️ helper to ensure loader visibility
const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default function DynamicRubricBuilder() {
  const router = useRouter();

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

  const [isEvaluating, setIsEvaluating] = useState(false);

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
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? updated : q))
    );
  };

  // ✅ SUBMIT HANDLER (WITH LOADER)
  const handleSubmit = async () => {
    // ---------- VALIDATION ----------
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
          alert(
            `Question ${q.questionNo}: Marking scheme total must be 100%.`
          );
          return;
        }
      }

      if (q.type === "custom" && !q.customText?.trim()) {
        alert(`Question ${q.questionNo}: Custom rubric is required.`);
        return;
      }
    }

    // ---------- FRONTEND PAYLOAD ----------
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
        customRubric:
          q.type === "custom" ? q.customText : undefined,
      })),
    };

    // ---------- MAP TO BACKEND ----------
    const evaluationRequest =
      mapToEvaluationRequest(payload);

    try {
      setIsEvaluating(true);

      // ensure loader renders
      await wait(300);

      const response = await fetch(
        "http://localhost:8000/evaluate/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evaluationRequest),
        }
      );

      if (!response.ok) {
        throw new Error("Evaluation failed");
      }

      const evaluationResult = await response.json();

      localStorage.setItem(
        "evaluationResult",
        JSON.stringify(evaluationResult)
      );

      // UX guarantee: loader visible
      await wait(800);

      router.push("/result");
    } catch (error) {
      console.error(error);
      alert("Error while evaluating answers.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // ✅ JSX RENDER (OUTSIDE handleSubmit)
  return (
    <div className="relative space-y-8">
      {/* Quiz Title */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Quiz Title
        </label>
        <input
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          placeholder="Enter your quiz title..."
          className="input-modern"
        />
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.questionNo} className="animate-fade-in">
            <QuestionRubricCard
              data={q}
              onChange={(updated) =>
                updateQuestion(i, updated)
              }
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          onClick={addQuestion}
          disabled={isEvaluating}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </button>

        <button
          onClick={handleSubmit}
          disabled={isEvaluating}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Submit for Evaluation
        </button>
      </div>

      {/* Loader Overlay */}
      {isEvaluating && <EvaluationLoader />}
    </div>
  );
}
