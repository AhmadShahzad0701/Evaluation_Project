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
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-semibold">Evaluation Summary</h1>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="rounded bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Score</p>
              <p className="text-xl font-semibold text-blue-600">
                {data.overall_obtained_marks} / {data.overall_max_marks}
              </p>
            </div>

            <div className="rounded bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Percentage</p>
              <p className="text-xl font-semibold text-green-600">
                {percentage}%
              </p>
            </div>

            <div className="rounded bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Questions</p>
              <p className="text-xl font-semibold">
                {data.results.length}
              </p>
            </div>
          </div>
        </div>

        {data.results.map((q, i) => (
          <div key={i} className="rounded-xl bg-white p-6 shadow space-y-4">
            <div className="flex justify-between">
              <h2 className="font-semibold">Question {i + 1}</h2>
              <span className="font-semibold text-blue-600">
                {q.obtained_marks} / {q.max_marks}
              </span>
            </div>

            <div className="h-2 w-full rounded bg-slate-200">
              <div
                className="h-full rounded bg-blue-600"
                style={{
                  width: `${(q.obtained_marks / q.max_marks) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(q.breakdown).map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between rounded bg-slate-50 px-3 py-2"
                >
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-600">{q.feedback}</p>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded bg-slate-50 p-3">
                LLM: {q.signals?.llm ?? "—"}
              </div>
              <div className="rounded bg-slate-50 p-3">
                NLI: {q.signals?.nli ?? "—"}
              </div>
              <div className="rounded bg-slate-50 p-3">
                Similarity: {q.signals?.similarity ?? "—"}
              </div>
            </div>

            <p className="text-sm">
              Confidence: {(q.confidence * 100).toFixed(1)}%
            </p>
          </div>
        ))}

        <div className="flex justify-center pt-6">
          <button
            onClick={() => {
              localStorage.removeItem("evaluationResult");
              router.push("/");
            }}
            className="rounded bg-blue-600 px-6 py-3 text-white"
          >
            Evaluate Another Quiz
          </button>
        </div>
      </div>
    </main>
  );
}
