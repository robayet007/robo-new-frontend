function RoboGameZone() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-4xl">🎮</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-violet-600 to-fuchsia-500 mb-2">
            Robo Game Zone
          </h1>
        </div>
        
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 border border-purple-200 shadow-sm">
          <p className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
            Update Coming Soon
          </p>
          <p className="text-sm sm:text-base text-slate-600">
            We're working on something amazing! Stay tuned for exciting updates.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
          <span>Under Development</span>
        </div>
      </div>
    </div>
  );
}

export default RoboGameZone;

