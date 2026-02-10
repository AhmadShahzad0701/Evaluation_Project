"use client";

export default function EvaluationLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-lg">
        {/* Spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        {/* Text */}
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">
            Evaluating Quiz
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Applying rubrics, analyzing answers, and generating feedback…
          </p>
        </div>
      </div>
    </div>
  );
}
