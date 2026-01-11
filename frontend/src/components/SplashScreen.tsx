import { useEffect, useState } from 'react';

function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50">
      {/* Dragon Flying Animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="text-9xl sm:text-[12rem] md:text-[16rem] lg:text-[20rem] select-none"
          style={{
            animation: 'dragonFly 3s ease-in-out infinite',
            transformOrigin: 'center center',
          }}
        >
          🐉
        </div>
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <img 
          src="/logo-robo.png" 
          alt="Robo Top Up Zone Logo" 
          className="w-32 h-32 border-4 border-purple-200 shadow-2xl sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-3xl animate-pulse"
          style={{ borderRadius: '24px' }}
        />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      {/* CSS Animation for Dragon */}
      <style>{`
        @keyframes dragonFly {
          0% {
            transform: translateX(-100vw) translateY(0) rotate(0deg) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          25% {
            transform: translateX(-20vw) translateY(-30px) rotate(-10deg) scale(1);
          }
          50% {
            transform: translateX(0) translateY(-50px) rotate(0deg) scale(1.1);
          }
          75% {
            transform: translateX(20vw) translateY(-30px) rotate(10deg) scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100vw) translateY(0) rotate(0deg) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default SplashScreen;

