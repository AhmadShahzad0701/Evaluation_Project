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
  // Initialize predefined schemes once
  const initializedSchemes: MarkingScheme[] =
    schemes.length > 0
      ? schemes
      : PREDEFINED_SCHEMES.map((s) => ({
          ...s,
          probability: 0,
        }));

  const updateProbability = (id: string, value: number) => {
    const updated = initializedSchemes.map((s) =>
      s.id === id ? { ...s, probability: value } : s,
    );
    onChange(updated);
  };

  const total = initializedSchemes.reduce(
    (sum, s) => sum + (s.probability || 0),
    0,
  );

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="grid grid-cols-3 text-sm font-medium text-slate-600 pb-2 border-b border-slate-200">
        <span className="col-span-2">Marking Scheme</span>
        <span className="text-right">Weight (%)</span>
      </div>

      {initializedSchemes.map((scheme) => (
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
              max={100}
              value={scheme.probability === 0 ? "" : scheme.probability}
              onChange={(e) =>
                updateProbability(scheme.id, Number(e.target.value))
              }
              className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-right text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">%</span>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <span className="text-sm font-medium text-slate-700">
          Total Probability
        </span>

        <span
          className={`text-sm font-semibold ${
            total === 100 ? "text-green-600" : "text-red-600"
          }`}
        >
          {total}%
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Distribute a total of 100% across the predefined schemes. Schemes with
        0% weight will be ignored during evaluation.
      </p>
    </div>
  );
}
