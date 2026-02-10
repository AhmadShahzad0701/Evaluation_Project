import ScoreCard from "@/components/results/ScoreCard";
import QuestionBreakdown from "@/components/results/QuestionBreakdown";

export default function ResultPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <ScoreCard />
        <QuestionBreakdown />
      </div>
    </main>
  );
}
