<div className="max-w-4xl mx-auto px-6 -mt-8">
  <div className="bg-white rounded-xl shadow-sm py-6">
    <div className="flex items-center justify-between px-8">
      {["Evaluation Input", "Evaluation Mode", "Result"].map(
        (label, i) => {
          const index = i + 1;
          const active = step >= index;

          return (
            <div key={label} className="flex-1 text-center">
              <div
                className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium
                ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index}
              </div>
              <p
                className={`mt-2 text-xs font-medium ${
                  active ? "text-blue-600" : "text-gray-400"
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
</div>
