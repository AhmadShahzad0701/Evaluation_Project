export default function Card({ children }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
      {children}
    </div>
  );
}
