'use client';

export default function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="animate-pulse rounded-xl border border-line bg-[rgba(214,213,201,0.02)] p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Venue name + price */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-44 rounded bg-[rgba(214,213,201,0.06)]" />
          <div className="h-3 w-60 rounded bg-[rgba(214,213,201,0.04)]" />
        </div>
        <div className="h-5 w-14 rounded bg-[rgba(214,213,201,0.06)]" />
      </div>
      {/* Tags */}
      <div className="mt-2.5 flex gap-1.5">
        <div className="h-5 w-16 rounded-md bg-[rgba(214,213,201,0.04)]" />
        <div className="h-5 w-12 rounded-md bg-[rgba(214,213,201,0.04)]" />
      </div>
      {/* Time pills */}
      <div className="mt-3 flex gap-1.5">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-9 w-[4.5rem] rounded-lg bg-[rgba(214,213,201,0.04)]"
          />
        ))}
      </div>
    </div>
  );
}
