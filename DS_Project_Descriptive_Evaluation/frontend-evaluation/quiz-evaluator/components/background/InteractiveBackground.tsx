"use client";

export default function InteractiveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated Gradient Background */}
      <div 
        className="absolute inset-0 animated-gradient opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, hsla(280, 85%, 60%, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, hsla(220, 90%, 60%, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, hsla(340, 85%, 65%, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 90% 70%, hsla(180, 75%, 50%, 0.2) 0%, transparent 50%)
          `,
          backgroundSize: '200% 200%',
        }}
      />
      
      {/* Floating Orbs */}
      <div className="absolute inset-0">
        {/* Large Orb 1 */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            top: '10%',
            left: '10%',
            background: 'radial-gradient(circle, hsl(280, 85%, 60%) 0%, transparent 70%)',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        
        {/* Large Orb 2 */}
        <div 
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            top: '60%',
            right: '15%',
            background: 'radial-gradient(circle, hsl(220, 90%, 60%) 0%, transparent 70%)',
            animation: 'float 15s ease-in-out infinite reverse',
            animationDelay: '2s',
          }}
        />
        
        {/* Medium Orb */}
        <div 
          className="absolute w-64 h-64 rounded-full blur-2xl opacity-15"
          style={{
            bottom: '20%',
            left: '40%',
            background: 'radial-gradient(circle, hsl(340, 85%, 65%) 0%, transparent 70%)',
            animation: 'float 18s ease-in-out infinite',
            animationDelay: '4s',
          }}
        />
      </div>
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(hsla(260, 75%, 58%, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsla(260, 75%, 58%, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}
