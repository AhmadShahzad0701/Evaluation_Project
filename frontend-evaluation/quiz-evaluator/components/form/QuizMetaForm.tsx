"use client";

export default function QuizMetaForm() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Quiz Information</h2>

      <input
        className="w-full rounded-lg border text-slate-900 border-slate-300 bg-slate-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Quiz Title"
      />

      <input
        type="number"
        className="w-full rounded-lg border text-slate-900 border-slate-300 bg-slate-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Total Marks"
      />
    </section>
  );
}
