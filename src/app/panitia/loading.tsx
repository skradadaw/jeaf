const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`rounded-xl bg-slate-200/80 ${className}`}></div>
);

export default function PanitiaLoading() {
  return (
    <section
      className="w-full motion-safe:animate-pulse"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Memuat halaman dashboard"
    >
      <span className="sr-only">Memuat halaman dashboard...</span>

      <div className="mb-6 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-100 to-indigo-100 p-6">
        <SkeletonBlock className="h-3 w-32 bg-purple-200/80" />
        <SkeletonBlock className="mt-3 h-7 w-64 max-w-full bg-purple-200/80" />
        <SkeletonBlock className="mt-3 h-4 w-[28rem] max-w-full bg-purple-200/70" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-12 w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="mt-3 h-7 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-5 w-44 max-w-full" />
            <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-32" />
        </div>
        <div className="divide-y divide-slate-100">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-4 p-5">
              <SkeletonBlock className="h-9 w-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-48 max-w-full" />
                <SkeletonBlock className="mt-2 h-3 w-32 max-w-full" />
              </div>
              <SkeletonBlock className="hidden h-7 w-24 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
