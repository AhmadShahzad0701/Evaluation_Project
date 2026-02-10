export default function StudentForm({ data, setData, next }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-gray-800">
        Student Information
      </h2>

      <input
       className="w-full border border-gray-400 text-gray-900 placeholder:text-gray-500 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"

        placeholder="Student Name"
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
      />

      <input
        className="w-full border border-gray-400 text-gray-900 placeholder:text-gray-500 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"

        placeholder="Roll Number"
        value={data.rollNo}
        onChange={(e) => setData({ ...data, rollNo: e.target.value })}
      />

      <input
        className="w-full border border-gray-400 text-gray-900 placeholder:text-gray-500 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"

        placeholder="Subject"
        value={data.subject}
        onChange={(e) => setData({ ...data, subject: e.target.value })}
      />

      <button
        onClick={next}
        className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-lg font-medium"
      >
        Next
      </button>
    </div>
  );
}
