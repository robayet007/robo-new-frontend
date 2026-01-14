function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      {/* Hero/Banner Skeleton */}
      <div className="mb-4 sm:mb-5 md:mb-7">
        <div className="w-full h-48 rounded-lg sm:h-64 md:h-80 bg-slate-200"></div>
      </div>

      {/* Product Grid Skeleton */}
      <section className="mt-4 sm:mt-5 md:mt-7 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="w-32 h-6 mb-2 rounded-full bg-slate-200"></div>
            <div className="w-48 mb-2 rounded h-7 bg-slate-200"></div>
            <div className="w-64 h-4 rounded bg-slate-200"></div>
          </div>
          
          {/* Category Cards Skeleton */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="w-full rounded-lg aspect-square bg-slate-200"></div>
                <div className="w-3/4 h-4 mx-auto rounded bg-slate-200"></div>
                <div className="w-1/2 h-3 mx-auto rounded bg-slate-200"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export default SkeletonLoader;
