export default function MarksForm({ marks, setMarks, next, back }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-gray-800">
        Question Evaluation
      </h2>

      {["q1", "q2", "q3"].map((q, i) => (
        <input
          key={q}
          type="number"
          className="w-full border border-gray-400 text-gray-900 placeholder:text-gray-500 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"

          placeholder={`Question ${i + 1} Marks`}
          value={marks[q]}
          onChange={(e) =>
            setMarks({ ...marks, [q]: e.target.value })
          }
        />
      ))}

      <div className="flex gap-3">
         <button
          onClick={back}
          className="w-full border border-gray-300 py-3 rounded-lg font-medium text-gray-700"
        >
          Back
        </button>

        <button
          onClick={next}
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-lg font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}
