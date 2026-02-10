export default function SuccessScreen() {
  return (
    <div className="text-center space-y-4 animate-fadeIn">
      <div className="text-green-600 text-5xl">✓</div>
      <h2 className="text-2xl font-bold text-gray-900">
        Evaluation Submitted
      </h2>
      <p className="text-gray-500">
        Student evaluation has been successfully saved.
      </p>
    </div>
  );
}
