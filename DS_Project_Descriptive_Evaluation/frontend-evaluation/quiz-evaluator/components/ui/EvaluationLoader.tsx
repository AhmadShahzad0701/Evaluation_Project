"use client";

export default function EvaluationLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-white p-10 shadow-2xl max-w-md mx-4 animate-slide-in-up">
        {/* Gradient Spinner */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-purple-600 border-r-blue-600 animate-spin"></div>
          <div className="absolute inset-2 w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-900">
            Evaluating Quiz
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            AI is analyzing responses, applying rubrics, and generating detailed feedback...
          </p>
        </div>

        {/* Progress Steps */}
        <div className="w-full space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Parsing questions</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-purple-600 font-medium">
            <div className="w-5 h-5 rounded-full border-2 border-purple-600 flex items-center justify-center flex-shrink-0 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            </div>
            <span>Analyzing responses</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0"></div>
            <span>Generating  feedback</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-shimmer" style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite'
          }}></div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
