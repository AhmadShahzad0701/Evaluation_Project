"use client";

import { MarkingScheme } from "@/types/rubric";

type Props = {
  schemes: MarkingScheme[];
  onChange: (s: MarkingScheme[]) => void;
};

const PREDEFINED_SCHEMES: Omit<MarkingScheme, "probability">[] = [
  { id: "correct", label: "Completely Correct Answer" },
  { id: "mostly", label: "Mostly Correct (Minor Mistakes)" },
  { id: "partial", label: "Partially Correct" },
  { id: "attempted", label: "Concept Attempted but Incorrect" },
  { id: "none", label: "No Relevant Answer" },
];

export default function MarkingSchemeEditor({ schemes, onChange }: Props) {
  const initializedSchemes: MarkingScheme[] =
    schemes.length > 0
      ? schemes
      : PREDEFINED_SCHEMES.map((s) => ({
          ...s,
          probability: 0,
        }));

  const total = initializedSchemes.reduce(
    (sum, s) => sum + s.probability,
    0
  );

  const remaining = 100 - total;

  const updateProbability = (id: string, value: number) => {
    const safeValue = Math.max(0, Math.min(100, value));

    const updated = initializedSchemes.map((s) =>
      s.id === id ? { ...s, probability: safeValue } : s
    );

    const newTotal = updated.reduce(
      (sum, s) => sum + s.probability,
      0
    );

    if (newTotal <= 100) {
      onChange(updated);
    }
  };

  const getColorForScheme = (id: string) => {
    const colors = {
      correct: "from-green-500 to-emerald-500",
      mostly: "from-blue-500 to-cyan-500",
      partial: "from-yellow-500 to-orange-500",
      attempted: "from-orange-500 to-red-500",
      none: "from-red-500 to-pink-500",
    };
    return colors[id as keyof typeof colors] || "from-purple-500 to-blue-500";
  };

  return (
    <div className="space-y-6 rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Marking Scheme Distribution
        </h4>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          total === 100 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
        }`}>
          {total}% / 100%
        </span>
      </div>

      {/* Schemes */}
      <div className="space-y-4">
        {initializedSchemes.map((scheme, index) => {
          const maxAllowed = scheme.probability + remaining;
          const gradientColor = getColorForScheme(scheme.id);

          return (
            <div
              key={scheme.id}
              className="space-y-2 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              {/* Label and Input Row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradientColor}`}></div>
                  <span className="text-sm font-medium text-slate-800">
                    {scheme.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={maxAllowed}
                    value={scheme.probability === 0 ? "" : scheme.probability}
                    onChange={(e) =>
                      updateProbability(
                        scheme.id,
                        Number(e.target.value)
                      )
                    }
                    className={`w-20 rounded-lg border-2 px-3 py-2 text-sm font-semibold text-right focus:outline-none focus:ring-2 transition-all
                      ${
                        total >= 100 && scheme.probability === 0
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-white text-slate-900 border-slate-300 focus:border-purple-500 focus:ring-purple-100"
                      }`}
                    disabled={total >= 100 && scheme.probability === 0}
                  />
                  <span className="text-sm font-bold text-slate-700">%</span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              {scheme.probability > 0 && (
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradientColor} transition-all duration-300`}
                    style={{ width: `${scheme.probability}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total Progress Visual */}
      <div className="space-y-2 pt-4 border-t-2 border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            Total Allocation
          </span>
          <span className={`text-sm font-bold ${
            total === 100 ? "text-green-600" : total > 100 ? "text-red-600" : "text-orange-600"
          }`}>
            {total}% {total === 100 && "✓"}
          </span>
        </div>

        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              total === 100
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : total > 100
                ? "bg-gradient-to-r from-red-500 to-pink-500"
                : "bg-gradient-to-r from-purple-500 to-blue-500"
            }`}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>
      </div>

      {/* Helper Text */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-blue-800 leading-relaxed">
          Distribute 100% total weight across schemes. Schemes with 0% will be ignored during evaluation.
        </p>
      </div>
    </div>
  );
}
