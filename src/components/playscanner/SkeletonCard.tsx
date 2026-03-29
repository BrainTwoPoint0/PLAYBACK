'use client';

export default function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 rounded bg-white/[0.06]" />
          <div className="h-3 w-56 rounded bg-white/[0.04]" />
        </div>
        <div className="h-6 w-16 rounded bg-white/[0.06]" />
      </div>
      <div className="mt-3 flex gap-1.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-16 rounded-lg bg-white/[0.04]" />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-3 w-32 rounded bg-white/[0.04]" />
        <div className="h-8 w-20 rounded-lg bg-white/[0.06]" />
      </div>
    </div>
  );
}
