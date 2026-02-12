"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EvaluationResult = {
  question_id: string;
  max_marks: number;
  obtained_marks: number;
  breakdown: Record<string, number>; // strict rubric breakdown
  feedback: string;
  signals?: { // diagnostic metrics
    llm?: number;
    nli?: number;
    similarity?: number;
  };
  rubric: Record<string, number>; // original weights
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

  const getGradeColor = (percent: number) => {
    if (percent >= 90) return "from-green-500 to-emerald-500";
    if (percent >= 80) return "from-blue-500 to-cyan-500";
    if (percent >= 70) return "from-yellow-500 to-orange-500";
    if (percent >= 60) return "from-orange-500 to-red-400";
    return "from-red-500 to-pink-500";
  };

  const getGrade = (percent: number) => {
    if (percent >= 90) return "A+";
    if (percent >= 80) return "A";
    if (percent >= 70) return "B";
    if (percent >= 60) return "C";
    return "D";
  };

  const formatKey = (key: string) => {
    const map: Record<string, string> = {
      conceptual_understanding: "Conceptual Understanding",
      completeness_length: "Completeness & Length",
      language_clarity: "Language Clarity",
      answering_accuracy: "Accuracy",
    };
    if (map[key]) return map[key];

    return key
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const gradientColor = getGradeColor(Number(percentage));
  const grade = getGrade(Number(percentage));
  const isExcellent = Number(percentage) >= 80;

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `
          linear-gradient(hsla(260, 75%, 58%, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, hsla(260, 75%, 58%, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}></div>

      <div className="relative z-10 px-6 py-12">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold mb-2">Evaluation Results</h1>
              <p className="text-slate-600">Strict contract-driven assessment</p>
            </div>
            {isExcellent && (
              <div className="text-4xl animate-bounce">🎉</div>
            )}
          </div>

          {/* ===== SUMMARY CARDS ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-up">
            {/* Overall Score Card */}
            <div className="premium-card p-6 relative overflow-hidden col-span-1 md:col-span-2">
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${gradientColor}`}></div>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Overall Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold bg-gradient-to-r ${gradientColor} bg-clip-text text-transparent`}>
                      {percentage}%
                    </span>
                    <span className="text-2xl font-semibold text-slate-400">
                      {data.overall_obtained_marks.toFixed(1)}/{data.overall_max_marks}
                    </span>
                  </div>
                </div>
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradientColor} flex items-center justify-center text-white text-3xl font-bold shadow-xl`}>
{grade}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Performance</span>
                  <span className="text-slate-600">{data.overall_obtained_marks.toFixed(1)} pts</span>
                </div>
                <div className="h-4 rounded-full bg-slate-200 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${gradientColor} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Questions Stats Card */}
            <div className="premium-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Questions</p>
                  <p className="text-3xl font-bold text-slate-900">{data.results.length}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-2">All questions evaluated</p>
            </div>
          </div>

          {/* ===== PER QUESTION RESULTS ===== */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Detailed Breakdown
            </h2>

            {data.results.map((q, i) => {
              const questionPercentage = Math.round((q.obtained_marks / q.max_marks) * 100);
              const questionGradient = getColorForScheme(questionPercentage);

              return (
                <section
                  key={i}
                  className="premium-card p-8 space-y-6 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${questionGradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Question {i + 1}</h3>
                        <span className="badge-gradient">{questionPercentage}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold bg-gradient-to-r ${questionGradient} bg-clip-text text-transparent`}>
                        {q.obtained_marks}/{q.max_marks}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${questionGradient} transition-all duration-1000`}
                        style={{ width: `${questionPercentage}%` }}
                      />
                    </div>
                  </div>

                    {/* Rubric Breakdown */}
                    <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Rubric Breakdown
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(q.breakdown).map(([k, normalizedScore]) => {
                            // Backend sends normalized score (0-1).
                            // We need to multiply by the user-defined weight to get the actual points.
                            // If weight is 0, skip it as per user request.
                            const weight = q.rubric?.[k] ?? 0;
                            if (weight === 0) return null;

                            const obtained = normalizedScore * weight;

                            return (
                                <div
                                key={k}
                                className="flex flex-col rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 px-4 py-3 hover:shadow-md transition-all"
                                >
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-medium text-slate-700">{formatKey(k)}</span>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-900 leading-none">
                                            {obtained.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ {weight}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Mini bar */}
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-purple-500 transition-all duration-500" 
                                        style={{ width: `${normalizedScore * 100}%` }}
                                    ></div>
                                </div>
                                </div>
                            );
                        })}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      AI Feedback
                    </p>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {q.feedback}
                    </p>
                  </div>

                  {/* Evaluation Signals / Metrics */}
                  {q.signals && (
                    <div className="opacity-75">
                      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Diagnostics</p>
                      <div className="flex gap-4">
                        {Object.entries(q.signals).map(([key, value]) => (
                          <div key={key} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            <span className="font-mono">{key}:</span> <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence Score */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                    <span className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Confidence Score (Model Certainty)
                    </span>
                    <span className="text-sm font-bold text-green-700">
                      {(q.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </section>
              );
            })}
          </div>

          {/* ===== ACTION BUTTONS ===== */}
          <div className="flex justify-center gap-4 pt-8 animate-fade-in">
            <button
              onClick={() => {
                localStorage.removeItem("evaluationResult");
                router.push("/");
              }}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Evaluate Another Quiz
            </button>
          </div>
        </div>
      </div>
    </main>
  );

  function getColorForScheme(percentage: number) {
    if (percentage >= 90) return "from-green-500 to-emerald-500";
    if (percentage >= 80) return "from-blue-500 to-cyan-500";
    if (percentage >= 70) return "from-yellow-500 to-orange-500";
    if (percentage >= 60) return "from-orange-500 to-red-400";
    return "from-red-500 to-pink-500";
  }
}
