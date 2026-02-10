"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EvaluationResult = {
  question_id: string;
  max_marks: number;
  obtained_marks: number;
  breakdown: Record<string, number>;
  feedback: string;
  signals?: {
    llm?: number;
    nli?: number;
    similarity?: number;
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
      router.replace("/");
      return;
    }
    setData(JSON.parse(stored));
  }, [router]);

  if (!data) return null;

  const percentage = (
    (data.overall_obtained_marks / data.overall_max_marks) *
    100
  ).toFixed(1);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* ===== SUMMARY ===== */}
        <section className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Evaluation Summary
          </h1>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total Score</p>
              <p className="text-2xl font-semibold text-blue-600">
                {data.overall_obtained_marks} / {data.overall_max_marks}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Percentage</p>
              <p className="text-2xl font-semibold text-green-600">
                {percentage}%
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Questions Evaluated</p>
              <p className="text-2xl font-semibold text-slate-800">
                {data.results.length}
              </p>
            </div>
          </div>
        </section>

        {/* ===== PER QUESTION RESULTS ===== */}
        {data.results.map((q, i) => (
          <section
            key={i}
            className="rounded-xl bg-white p-6 shadow-sm space-y-5"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">
                Question {i + 1}
              </h2>
              <span className="text-sm font-semibold text-blue-600">
                {q.obtained_marks} / {q.max_marks}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${(q.obtained_marks / q.max_marks) * 100}%`,
                }}
              />
            </div>

            {/* Breakdown */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Rubric Breakdown
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(q.breakdown).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between rounded bg-slate-50 px-3 py-2"
                  >
                    <span className="text-slate-600">{k}</span>
                    <span className="font-medium text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                Feedback
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {q.feedback}
              </p>
            </div>

            {/* Signals */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Evaluation Signals
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">LLM</p>
                  <p className="font-semibold">
                    {q.signals?.llm ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">NLI</p>
                  <p className="font-semibold">
                    {q.signals?.nli ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Similarity</p>
                  <p className="font-semibold">
                    {q.signals?.similarity ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence */}
            <p className="text-sm text-slate-600">
              Confidence Score:{" "}
              <span className="font-semibold text-green-600">
                {(q.confidence * 100).toFixed(1)}%
              </span>
            </p>
          </section>
        ))}

        {/* ===== ACTION ===== */}
        <div className="flex justify-center pt-6">
          <button
            onClick={() => {
              localStorage.removeItem("evaluationResult");
              router.push("/");
            }}
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Evaluate Another Quiz
          </button>
        </div>

      </div>
    </main>
  );
}
