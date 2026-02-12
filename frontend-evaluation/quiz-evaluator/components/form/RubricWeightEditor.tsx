"use client";

import { useState, useEffect } from "react";
import { RubricWeight } from "@/types/rubric";

type Props = {
  value: RubricWeight;
  onChange: (value: RubricWeight) => void;
};

// Styles Presets
const STYLES = {
  balanced: {
    label: "Balanced (Default)",
    weights: {
      conceptual_understanding: 50,
      completeness_length: 30,
      language_clarity: 20
    }
  },
  concept: {
    label: "Concept-Focused",
    weights: {
        conceptual_understanding: 80,
        completeness_length: 10,
        language_clarity: 10
    }
  },
  strict: {
    label: "Strict(Length & Structure)",
    weights: {
        conceptual_understanding: 45,
        completeness_length: 35,
        language_clarity: 20
    }
  }
};

const LABELS: Record<keyof RubricWeight, string> = {
  conceptual_understanding: "Conceptual Understanding (Primary)",
  completeness_length: "Completeness & Length",
  language_clarity: "Language Clarity & Grammar",
};

export default function RubricWeightEditor({ value, onChange }: Props) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const sum = Object.values(value).reduce((a, b) => a + b, 0);
    setTotal(sum);
  }, [value]);

  const applyStyle = (styleKey: keyof typeof STYLES) => {
      onChange(STYLES[styleKey].weights);
  };

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
    <div className="space-y-6 rounded-xl bg-slate-50 p-6 border border-slate-200">
      
      {/* Header & Style Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Rubric Configuration
            </h4>
            <p className="text-xs text-slate-500 mt-1">Select a preset or customize weights</p>
        </div>

        <div className="flex gap-2">
            {Object.entries(STYLES).map(([key, config]) => (
                <button
                    key={key}
                    onClick={() => applyStyle(key as keyof typeof STYLES)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors shadow-sm"
                >
                    {config.label}
                </button>
            ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-6">
        {(Object.keys(LABELS) as Array<keyof RubricWeight>).map((key) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">
                {LABELS[key]}
                </label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Weight:</span>
                    <input
                        type="number"
                        value={value[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-16 px-2 py-1 text-right text-sm font-bold border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <span className="text-sm text-slate-500">%</span>
                </div>
            </div>
            
            <input
                type="range"
                min="0"
                max="100"
                step="5" // coarser step for easier 100% sum
                value={value[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        ))}
      </div>
      
      {/* Validation Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <span className="text-sm text-slate-500">Total Weight:</span>
        <span className={`text-lg font-bold ${isTotalValid ? 'text-green-600' : 'text-red-500'}`}>
            {total}%
        </span>
      </div>
      {!isTotalValid && (
          <p className="text-xs text-red-500 text-right font-medium animate-pulse">
              Weights must sum exactly to 100%
          </p>
      )}
    </div>
  );
}
