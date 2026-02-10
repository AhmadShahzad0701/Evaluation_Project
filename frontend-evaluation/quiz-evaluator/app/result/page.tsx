"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EvaluationResult = {
  question_id: string;
  max_marks: number;
  obtained_marks: number;
  breakdown: Record<string, number>;
  feedback: string;
  signals: {
    llm: number;
    nli: number;
    similarity: number;
  };
  confidence: number;
};

type EvaluationResponse = {
  results: EvaluationResult[];
  overall_max_marks: number;
  overall_obtained_marks: number;
};

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<EvaluationResponse | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("evaluationResult");

    if (!stored) {
      router.push("/");
      return;
    }

    setData(JSON.parse(stored));
  }, [router]);

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      {/* Header */}
      <div className="rounded-lg border bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-slate-900">
          Evaluation Result
        </h1>

        <p className="mt-2 text-slate-600">
          Overall Score
        </p>

        <div className="mt-4 text-3xl font-semibold text-blue-600">
          {data.overall_obtained_marks} / {data.overall_max_marks}
        </div>
      </div>

      {/* Per Question Results */}
      {data.results.map((res, idx) => (
        <div
          key={idx}
          className="rounded-lg border bg-white p-6 shadow space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-800">
            Question {idx + 1}
          </h2>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              Marks Obtained
            </span>
            <span className="font-medium">
              {res.obtained_marks} / {res.max_marks}
            </span>
          </div>

          {/* Breakdown */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              Rubric Breakdown
            </h3>
            <ul className="space-y-1 text-sm">
              {Object.entries(res.breakdown).map(
                ([key, value]) => (
                  <li
                    key={key}
                    className="flex justify-between text-slate-600"
                  >
                    <span>{key}</span>
                    <span>{value}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Signals */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              Evaluation Signals
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="rounded bg-slate-50 p-3 text-center">
                <div className="text-slate-500">LLM</div>
                <div className="font-semibold">
                  {res.signals.llm}
                </div>
              </div>
              <div className="rounded bg-slate-50 p-3 text-center">
                <div className="text-slate-500">NLI</div>
                <div className="font-semibold">
                  {res.signals.nli}
                </div>
              </div>
              <div className="rounded bg-slate-50 p-3 text-center">
                <div className="text-slate-500">Similarity</div>
                <div className="font-semibold">
                  {res.signals.similarity}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-1">
              Feedback
            </h3>
            <p className="text-sm text-slate-600">
              {res.feedback}
            </p>
          </div>

          {/* Confidence */}
          <div className="text-sm text-slate-600">
            Confidence Score:{" "}
            <span className="font-medium">
              {res.confidence}
            </span>
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex justify-center pt-6">
        <button
          onClick={() => {
            localStorage.removeItem("evaluationResult");
            router.push("/");
          }}
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Evaluate Another Quiz
        </button>
      </div>
    </div>
  );
}
