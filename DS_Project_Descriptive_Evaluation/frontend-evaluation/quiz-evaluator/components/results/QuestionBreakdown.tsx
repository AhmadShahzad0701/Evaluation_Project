export default function QuestionBreakdown() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((q) => (
        <div key={q} className="border rounded p-4">
          <h4 className="font-semibold">Question {q}</h4>
          <p>Selected Scheme: Partial Logic (60%)</p>
          <p>Marks Awarded: 6 / 10</p>
        </div>
      ))}
    </div>
  );
}
