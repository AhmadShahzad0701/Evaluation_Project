"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function CustomRubricEditor({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        Custom Rubric
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Define your evaluation criteria for this question..."
        className="w-full h-32 rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
