"use client";
import { useState } from "react";

export default function EvaluatePage() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState("balanced");

  const [form, setForm] = useState({
    question: "",
    answer: "",
    maxScore: 5,
  });

  const progress =
    step === 1 ? "33%" : step === 2 ? "66%" : "100%";

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold">AI Evaluation</h1>
          <p className="mt-2 text-white/80">
            Evaluate student answers using AI-powered grading
          </p>

          <div className="mt-8 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: progress }}
            />
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-5xl mx-auto px-6 mt-8">
        <div className="flex items-center justify-between">
          {["Evaluation Input", "Evaluation Mode", "Result"].map(
            (label, i) => {
              const index = i + 1;
              const active = step >= index;

              return (
                <div key={label} className="flex-1 text-center">
                  <div
                    className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                  >
                    {index}
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      active
                        ? "text-blue-600 font-medium"
                        : "text-gray-400"
                    }`}
                  >
                    {label}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Card */}
      <div className="max-w-3xl mx-auto px-6 mt-10 pb-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Evaluation Input
              </h2>

              <textarea
                className="w-full border border-gray-300 rounded-xl p-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                rows={4}
                placeholder="Enter question here"
                value={form.question}
                onChange={(e) =>
                  setForm({ ...form, question: e.target.value })
                }
              />

              <textarea
                className="w-full border border-gray-300 rounded-xl p-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                rows={6}
                placeholder="Enter student's answer here"
                value={form.answer}
                onChange={(e) =>
                  setForm({ ...form, answer: e.target.value })
                }
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Score
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-32 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.maxScore}
                  onChange={(e) =>
                    setForm({ ...form, maxScore: e.target.value })
                  }
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium transition"
              >
                Next →
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Choose Evaluation Style
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    key: "fast",
                    icon: "⚡",
                    title: "Fast",
                    desc: "Quick & lenient checking",
                  },
                  {
                    key: "balanced",
                    icon: "⚖️",
                    title: "Balanced",
                    desc: "Recommended default",
                  },
                  {
                    key: "strict",
                    icon: "🎯",
                    title: "Strict",
                    desc: "Exam-level evaluation",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setMode(item.key)}
                    className={`cursor-pointer border rounded-2xl p-6 text-center transition
                      ${
                        mode === item.key
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-400"
                      }`}
                  >
                    <div className="text-3xl">{item.icon}</div>
                    <h3 className="mt-3 font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="w-full border border-gray-300 py-4 rounded-xl font-medium text-gray-700"
                >
                  ← Back
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium transition"
                >
                  Evaluate →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Evaluation Result
              </h2>

              <div className="bg-gray-100 rounded-xl p-6">
                <p className="text-lg font-semibold text-gray-900">
                  Score: 3.5 / {form.maxScore}
                </p>
                <p className="mt-2 text-gray-700">
                  The answer demonstrates correct understanding but lacks
                  depth and examples.
                </p>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-medium transition"
              >
                New Evaluation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
