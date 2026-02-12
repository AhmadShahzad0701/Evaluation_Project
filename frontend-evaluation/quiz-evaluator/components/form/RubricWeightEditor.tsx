"use client";

import { useState, useEffect } from "react";
import { RubricWeight } from "@/types/rubric";

type Props = {
  value: RubricWeight;
  onChange: (value: RubricWeight) => void;
};

// Helper labels for the UI
const LABELS: Record<keyof RubricWeight, string> = {
  conceptual_understanding: "Conceptual Understanding",
  language_clarity: "Language Clarity",
  answer_completeness: "Answer Completeness",
  spelling_accuracy: "Spelling Accuracy",
  handling_incorrect: "Handling Incorrect",
  effort_bonus: "Effort Bonus",
};

export default function RubricWeightEditor({ value, onChange }: Props) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const sum = Object.values(value).reduce((a, b) => a + b, 0);
    setTotal(sum);
  }, [value]);

  const handleChange = (key: keyof RubricWeight, newVal: string) => {
    const num = parseFloat(newVal);
    if (!isNaN(num) && num >= 0) {
      onChange({ ...value, [key]: num });
    } else if (newVal === "") {
        onChange({ ...value, [key]: 0 });
    }
  };

  const isTotalValid = Math.abs(total - 100) < 0.1;

  return (
    <div className="space-y-4 rounded-xl bg-slate-50 p-6 border border-slate-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Rubric Weights
        </h4>
        <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${isTotalValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <span>Total: {total}%</span>
          {!isTotalValid && (
             <span className="text-xs font-normal opacity-80">(Must be 100)</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {(Object.keys(LABELS) as Array<keyof RubricWeight>).map((key) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-600">
                {LABELS[key]}
                </label>
                <span className="text-xs text-slate-400 font-mono">{value[key]}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={value[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <input
                type="number"
                value={value[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-16 px-2 py-1 text-right text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        ))}
      </div>
      
      {!isTotalValid && (
          <div className="text-xs text-red-500 text-right font-medium animate-pulse">
              ⚠️ Adjust weights to sum exactly to 100.
          </div>
      )}
    </div>
  );
}
