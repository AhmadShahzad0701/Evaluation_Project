"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { QuestionRubric, RubricWeight } from "@/types/rubric";
import { EvaluationSubmission } from "@/types/submission";
// We don't need mapToEvaluationRequest if we build the payload directly in the loop

import QuestionRubricCard from "./QuestionRubricCard";
import EvaluationLoader from "@/components/ui/EvaluationLoader";

// ⏱️ helper to ensure loader visibility
const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Default rubric weights (sum = 100) - Balanced Mode
const DEFAULT_RUBRIC: RubricWeight = {
  conceptual_understanding: 50,
  completeness_length: 30,
  language_clarity: 20,
};

export default function DynamicRubricBuilder() {
  const router = useRouter();

  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionRubric[]>([
      {
       questionNo: 1,
       questionText: "",
       studentAnswer: "",
       max_marks: 10,
       rubric: { ...DEFAULT_RUBRIC },
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
         max_marks: 10,
         rubric: { ...DEFAULT_RUBRIC },
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
      
      // Strict 100% check
      const totalWeight = Object.values(q.rubric).reduce((a, b) => a + b, 0);
      if (Math.abs(totalWeight - 100) > 0.1) {
          alert(`Question ${q.questionNo}: Rubric weights must sum exactly to 100. Current: ${totalWeight}`);
          return;
      }
    }

    try {
      setIsEvaluating(true);
      
      // Feedback for slow responses
      const slowTimer = setTimeout(() => {
          alert("Evaluation is taking longer than usual (LLM processing). Please wait...");
      }, 45000); // 45s warning

      await wait(300);

      const results = [];
      let overall_max = 0;
      let overall_obtained = 0;

      // Sequential evaluation to respect strict single-item contract
      for (const q of questions) {
          const payload = {
              question: q.questionText,
              student_answer: q.studentAnswer,
              rubric: q.rubric,
              max_score: q.max_marks,
              reference_answer: q.referenceAnswer || ""
          };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

          try {
            const response = await fetch(
                "http://localhost:8000/evaluate/",
                {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal
                }
            );
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Evaluation failed for Question ${q.questionNo}: ${errText}`);
            }

            const result = await response.json();
            
            // Augment result with question metadata for the results page
            results.push({
                ...result,
                question_id: `Q${q.questionNo}`, // Backend might return unknown
                max_marks: q.max_marks,
                obtained_marks: result.final_score,
                breakdown: result.rubric_breakdown, // Mapping for UI
                signals: result.metrics, // Mapping for UI
                rubric: q.rubric // Save original weights
            });
            
            overall_max += q.max_marks;
            overall_obtained += result.final_score;

          } catch (e: any) {
              if (e.name === 'AbortError') {
                  throw new Error(`Timeout: Question ${q.questionNo} took too long to evaluate.`);
              }
              throw e;
          }
      }

      clearTimeout(slowTimer);

      const finalResponse = {
          results,
          overall_max_marks: overall_max,
          overall_obtained_marks: parseFloat(overall_obtained.toFixed(2))
      };

      localStorage.setItem(
        "evaluationResult",
        JSON.stringify(finalResponse)
      );

      await wait(800);
      router.push("/result");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error while evaluating answers.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // ✅ JSX RENDER
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
