import InteractiveBackground from "@/components/background/InteractiveBackground";
import QuizMetaForm from "@/components/form/QuizMetaForm";
import PdfUploader from "@/components/form/PdfUploader";
import DynamicRubricBuilder from "@/components/form/DynamicRubricBuilder";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12 bg-slate-50">
      <InteractiveBackground />

      <div className="mx-auto max-w-5xl space-y-10 bg-white rounded-xl p-10 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-center">
          Quiz Evaluation Setup
        </h1>

        <QuizMetaForm />
        <PdfUploader />
        <DynamicRubricBuilder />
      </div>
    </main>
  );
}
