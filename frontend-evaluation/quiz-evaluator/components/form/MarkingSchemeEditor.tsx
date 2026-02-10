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

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="grid grid-cols-3 pb-2 text-sm font-medium text-slate-600 border-b border-slate-200">
        <span className="col-span-2">Marking Scheme</span>
        <span className="text-right">Weight (%)</span>
      </div>

      {initializedSchemes.map((scheme) => {
        const maxAllowed = scheme.probability + remaining;

        return (
          <div
            key={scheme.id}
            className="grid grid-cols-3 items-center gap-4 py-2"
          >
            <span className="col-span-2 text-sm text-slate-800">
              {scheme.label}
            </span>

            <div className="flex items-center justify-end gap-1">
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
                className={`w-20 rounded-md border px-2 py-1 text-sm text-right focus:outline-none focus:ring-2
                  ${
                    total >= 100 && scheme.probability === 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-white text-slate-900 border-slate-300 focus:ring-blue-500"
                  }`}
                disabled={total >= 100 && scheme.probability === 0}
              />
              <span className="text-sm font-medium text-slate-700">%</span>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <span className="text-sm font-medium text-slate-700">
          Total Probability
        </span>

        <span
          className={`text-sm font-semibold ${
            total === 100
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {total}%
        </span>
      </div>

      {total >= 100 && (
        <p className="text-xs text-green-700">
          Total probability reached 100%. Reduce an existing value to adjust.
        </p>
      )}

      <p className="text-xs text-slate-500">
        Distribute a total of 100% across the predefined schemes.
        Schemes with 0% weight will be ignored during evaluation.
      </p>
    </div>
  );
}
