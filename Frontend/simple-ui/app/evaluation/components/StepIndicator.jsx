export default function StepIndicator({ step }) {
  const steps = ["Student Info", "Evaluation", "Result"];

  return (
    <div className="flex justify-between mb-10">
      {steps.map((label, index) => {
        const current = index + 1;
        const active = step >= current;

        return (
          <div key={label} className="flex-1 text-center">
            <div
              className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                ${active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              {current}
            </div>

            <p
              className={`mt-2 text-sm font-medium ${
                active ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
