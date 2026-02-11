import InteractiveBackground from "@/components/background/InteractiveBackground";
import DynamicRubricBuilder from "@/components/form/DynamicRubricBuilder";

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <InteractiveBackground />
      
      {/* Hero Section */}
      <div className="relative z-10 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 mb-6 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-slate-700">AI-Powered Evaluation</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Quiz Evaluation Platform
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Transform your assessment workflow with intelligent grading, 
              detailed feedback, and comprehensive analytics
            </p>
          </div>

          {/* Main Content Card */}
          <div className="premium-card p-8 md:p-12 space-y-10 animate-slide-in-up">
            {/* Progress Steps Indicator */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  1
                </div>
                <span className="text-sm font-semibold text-slate-700">Quiz Setup</span>
              </div>
              <div className="flex-1 h-1 mx-4 bg-slate-200 rounded-full">
                <div className="h-full w-1/3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"></div>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                  2
                </div>
                <span className="text-sm font-medium text-slate-500">Results</span>
              </div>
            </div>

            {/* Form Components */}
            <DynamicRubricBuilder />
          </div>

          {/* Features Footer */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Lightning Fast</h3>
              <p className="text-sm text-slate-600">Instant evaluation with AI-powered grading</p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Accurate Grading</h3>
              <p className="text-sm text-slate-600">Precise assessment with custom rubrics</p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Detailed Analytics</h3>
              <p className="text-sm text-slate-600">Comprehensive feedback and insights</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}