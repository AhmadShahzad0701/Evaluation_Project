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
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        Question {data.questionNo}
      </h3>
      <hr className="border-slate-200" />

      {/* Question Text */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Question</label>
        <textarea
          value={data.questionText}
          onChange={(e) => onChange({ ...data, questionText: e.target.value })}
          placeholder="Enter the question here..."
          className="w-full h-24 rounded-lg border text-slate-900 border-slate-300 bg-slate-50 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Student Answer */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Student Response</label>
        <textarea
          value={data.studentAnswer}
          onChange={(e) => onChange({ ...data, studentAnswer: e.target.value })}
          placeholder="Student answer will appear here..."
          className="w-full h-24 rounded-lg border text-slate-900 border-slate-300 bg-slate-50 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Rubric Type Selector */}
      <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() =>
            onChange({
              ...data,
              type: "scheme",
              customText: undefined,
            })
          }
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition
      ${
        data.type === "scheme"
          ? "bg-blue-600 text-white shadow"
          : "text-slate-700 hover:bg-white hover:text-slate-900"
      }`}
        >
          Marking Scheme
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
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition
      ${
        data.type === "custom"
          ? "bg-blue-600 text-white shadow"
          : "text-slate-700 hover:bg-white hover:text-slate-900"
      }`}
        >
          Custom Rubric
        </button>
      </div>

      {/* Rubric Editor */}
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
  );
}
