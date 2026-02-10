"use client";

export default function PdfUploader() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">
        Upload Answer Script (PDF)
      </h2>

      <div className="flex items-center gap-4 rounded-lg border border-slate-300 bg-slate-50 p-4">
        <input
          type="file"
          accept="application/pdf"
          className="block w-full text-sm text-slate-700
                     file:mr-4 file:rounded-md file:border-0
                     file:bg-blue-600 file:px-4 file:py-2
                     file:text-sm file:font-medium file:text-white
                     hover:file:bg-blue-700
                     focus:outline-none"
        />
      </div>

      <p className="text-sm text-slate-600">
        The uploaded PDF will be parsed automatically to extract
        student responses for evaluation.
      </p>
    </section>
  );
}
