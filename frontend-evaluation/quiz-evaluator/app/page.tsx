"use client";

import { useEffect, useState } from "react";

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
  const [data, setData] = useState<EvaluationResponse | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("evaluationResult");
    if (stored) setData(JSON.parse(stored));
  }, []);

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-600">
        No result found.
      </div>
    );
  }

  const percentage = (
    (data.overall_obtained_marks / data.overall_max_marks) *
    100
  ).toFixed(1);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* SUMMARY */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Evaluation Summary
          </h1>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Score</p>
              <p className="text-xl font-semibold text-blue-600">
                {data.overall_obtained_marks} /{" "}
                {data.overall_max_marks}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Percentage</p>
              <p className="text-xl font-semibold text-green-600">
                {percentage}%
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Questions Evaluated
              </p>
              <p className="text-xl font-semibold">
                {data.results.length}
              </p>
            </div>
          </div>
        </div>

        {/* PER QUESTION */}
        {data.results.map((q, i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-6 shadow-sm space-y-4"
          >
            <div className="flex justify-between">
              <h2 className="font-semibold text-slate-800">
                Question {q.question_id}
              </h2>
              <span className="font-semibold text-blue-600">
                {q.obtained_marks} / {q.max_marks}
              </span>
            </div>

            {/* Progress */}
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${
                    (q.obtained_marks / q.max_marks) * 100
                  }%`,
                }}
              />
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(q.breakdown).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between rounded bg-slate-50 px-3 py-2"
                  >
                    <span className="text-slate-600">
                      {key}
                    </span>
                    <span className="font-medium">
                      {value}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Feedback */}
            <div>
              <p className="text-sm font-medium text-slate-700">
                Feedback
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {q.feedback}
              </p>
            </div>

            {/* Signals */}
            <div className="grid grid-cols-3 gap-3 text-sm text-center">
              <div className="rounded bg-slate-50 p-3">
                <p className="text-slate-500">LLM</p>
                <p className="font-semibold">
                  {q.signals.llm}
                </p>
              </div>
              <div className="rounded bg-slate-50 p-3">
                <p className="text-slate-500">NLI</p>
                <p className="font-semibold">
                  {q.signals.nli}
                </p>
              </div>
              <div className="rounded bg-slate-50 p-3">
                <p className="text-slate-500">
                  Similarity
                </p>
                <p className="font-semibold">
                  {q.signals.similarity}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Confidence:{" "}
              <span className="font-semibold text-green-600">
                {(q.confidence * 100).toFixed(1)}%
              </span>
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
