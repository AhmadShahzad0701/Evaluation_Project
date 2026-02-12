"use client";

import { QuestionRubric, RubricWeight } from "@/types/rubric";
import RubricWeightEditor from "./RubricWeightEditor";

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
        
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Marks</label>
            <input
                type="number"
                min="1"
                max="100"
                value={data.max_marks || 10}
                onChange={(e) => onChange({ ...data, max_marks: Math.max(1, parseInt(e.target.value) || 0) })}
                className="w-16 text-center font-bold text-slate-800 bg-transparent outline-none border-l border-slate-200 pl-2 focus:text-purple-600"
            />
        </div>
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

      {/* Rubric Weights */}
      <div className="pt-2">
        <RubricWeightEditor
            value={data.rubric}
            onChange={(rubric: RubricWeight) => onChange({ ...data, rubric })}
        />
      </div>
    </div>
  );
}
