export default function ProgressBar({ step }) {
  const percent = step === 1 ? "33%" : step === 2 ? "66%" : "100%";

  return (
    <div className="mb-8">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-500"
          style={{ width: percent }}
        />
      </div>

      <div className="flex justify-between mt-3 text-sm text-gray-500">
        <span>Student</span>
        <span>Evaluation</span>
        <span>Result</span>
      </div>
    </div>
  );
}
