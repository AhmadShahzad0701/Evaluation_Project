"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function CustomRubricEditor({ value, onChange }: Props) {
  const charCount = value.length;
  const minChars = 20;
  const isValid = charCount >= minChars;

  return (
    <div className="space-y-3 rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Custom Evaluation Rubric
        </label>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          isValid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
        }`}>
          {charCount} chars {isValid && "✓"}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Define your custom evaluation criteria here... &#10;&#10;Example:&#10;• Award full marks for correct explanation of key concepts&#10;• Deduct points for missing technical terms&#10;• Consider clarity and organization of answer"
        className="w-full h-40 rounded-xl border-2 border-slate-300 bg-white p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none"
      />

      {/* Helper Text */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
        <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-purple-800 leading-relaxed">
          Provide detailed grading criteria. The AI will use these instructions to evaluate the student's answer and provide specific feedback.
        </p>
      </div>
    </div>
  );
}
