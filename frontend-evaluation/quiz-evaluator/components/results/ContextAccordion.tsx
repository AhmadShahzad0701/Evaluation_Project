"use client";

import { useState } from "react";

interface ContextAccordionProps {
  questionText?: string;
  userAnswer?: string;
  referenceAnswer?: string;
}

export default function ContextAccordion({
  questionText,
  userAnswer,
  referenceAnswer,
}: ContextAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if there's nothing meaningful to show
  if (!questionText && !userAnswer && !referenceAnswer) return null;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-3 bg-white hover:bg-slate-50 transition-colors duration-150 group"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
          <svg
            className="w-4 h-4 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
            />
          </svg>
          Show Question Details
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-5 space-y-5">
          {/* The Question */}
          {questionText && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                The Question
              </p>
              <p className="font-mono text-sm text-slate-800 leading-relaxed bg-white border border-slate-200 rounded-lg px-4 py-3">
                {questionText}
              </p>
            </div>
          )}

          {/* User's Response */}
          {userAnswer && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Your Response
              </p>
              <p className="font-mono text-sm text-slate-800 leading-relaxed bg-white border border-slate-200 rounded-lg px-4 py-3 whitespace-pre-wrap">
                {userAnswer}
              </p>
            </div>
          )}

          {/* Reference Answer */}
          {referenceAnswer && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
                Reference Answer
              </p>
              <p className="font-serif text-sm text-slate-800 leading-relaxed bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 whitespace-pre-wrap">
                {referenceAnswer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
