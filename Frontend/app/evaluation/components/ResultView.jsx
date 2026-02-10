export default function ResultView({ student, marks, back, submit }) {
  const total =
    Number(marks.q1 || 0) +
    Number(marks.q2 || 0) +
    Number(marks.q3 || 0);

  const field = (value) =>
    value && value.trim() !== "" ? value : "—";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        Final Result
      </h2>

      {/* Student Summary */}
      <div className="bg-gray-100 rounded-xl p-4 space-y-2 text-sm">
        <p className="text-gray-800">
          <span className="font-medium">Name:</span>{" "}
          <span className="text-gray-900">{field(student.name)}</span>
        </p>

        <p className="text-gray-800">
          <span className="font-medium">Roll No:</span>{" "}
          <span className="text-gray-900">{field(student.rollNo)}</span>
        </p>

        <p className="text-gray-800">
          <span className="font-medium">Subject:</span>{" "}
          <span className="text-gray-900">{field(student.subject)}</span>
        </p>
      </div>

      {/* Total Marks */}
      <div className="text-lg font-semibold text-gray-900">
        Total Marks: {total}
      </div>

      {/* Remarks */}
      <textarea
        className="w-full border border-gray-400 text-gray-900 placeholder:text-gray-500 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        placeholder="Teacher remarks"
      />

      <div className="flex gap-3 pt-2">
        <button
          onClick={back}
          className="w-full border border-gray-300 py-3 rounded-lg font-medium text-gray-700"
        >
          Back
        </button>

        <button
          onClick={submit}
          className="w-full bg-green-600 hover:bg-green-700 transition text-white py-3 rounded-lg font-medium"
        >
          Submit Evaluation
        </button>
      </div>
    </div>
  );
}
