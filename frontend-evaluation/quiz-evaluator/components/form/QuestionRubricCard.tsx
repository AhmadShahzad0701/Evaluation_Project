"use client";

import { QuestionRubric, MarkingScheme } from "@/types/rubric";
import MarkingSchemeEditor from "./MarkingSchemeEditor";
import CustomRubricEditor from "./CustomRubricEditor";

type Props = {
  data: QuestionRubric;
  onChange: (q: QuestionRubric) => void;
};

export default function QuestionRubricCard({ data, onChange }: Props) {
  return (
    <div className="premium-card relative overflow-hidden p-8 space-y-6">
      {/* Gradient Accent Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>
      
      {/* Header with Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
            {data.questionNo}
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Question {data.questionNo}
          </h3>
        </div>
        <span className="badge-gradient">Required</span>
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Question Text
        </label>
        <textarea
          value={data.questionText}
          onChange={(e) => onChange({ ...data, questionText: e.target.value })}
          placeholder="Enter the question here..."
          className="textarea-modern"
        />
      </div>

      {/* Student Answer */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Student Response
        </label>
        <textarea
          value={data.studentAnswer}
          onChange={(e) => onChange({ ...data, studentAnswer: e.target.value })}
          placeholder="Student answer will appear here..."
          className="textarea-modern"
        />
      </div>

      {/* Rubric Type Selector - Modern Tab Style */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700">Evaluation Method</label>
        <div className="inline-flex rounded-xl border-2 border-slate-200 bg-slate-50 p-1.5 gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                ...data,
                type: "scheme",
                customText: undefined,
              })
            }
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
              ${
                data.type === "scheme"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
          >
            📊 Marking Scheme
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...data,
                type: "custom",
                schemes: undefined,
              })
            }
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
              ${
                data.type === "custom"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
          >
            ✍️ Custom Rubric
          </button>
        </div>
      </div>

      {/* Rubric Editor */}
      <div className="pt-4">
        {data.type === "scheme" ? (
          <MarkingSchemeEditor
            schemes={data.schemes || []}
            onChange={(schemes: MarkingScheme[]) =>
              onChange({ ...data, schemes })
            }
          />
        ) : (
          <CustomRubricEditor
            value={data.customText || ""}
            onChange={(text: string) => onChange({ ...data, customText: text })}
          />
        )}
      </div>
    </div>
  );
}
