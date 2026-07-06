'use client';

import { ADMIN_AMBER } from './theme';

interface FunnelStepsProps {
  steps: Array<{ label: string; value: number }>;
  // If true, the amber series paints the last step (revenue-earning click).
  emphasiseLast?: boolean;
}

// Horizontal drop-off funnel. Each row: eyebrow label + tabular count +
// absolute-width bar + drop-off percent relative to the previous step.
export function FunnelSteps({ steps, emphasiseLast = true }: FunnelStepsProps) {
  if (steps.length === 0) {
    return (
      <div className="py-10 text-center text-[12px] text-ink-muted">
        No funnel activity in this window.
      </div>
    );
  }
  const top = steps[0].value || 1;

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const prev = i === 0 ? null : steps[i - 1].value;
        const width = Math.max((step.value / top) * 100, 0.8);
        const dropoff = prev && prev > 0 ? (1 - step.value / prev) * 100 : null;
        const stepConv = prev && prev > 0 ? (step.value / prev) * 100 : null;
        const isLast = i === steps.length - 1;
        const fill =
          emphasiseLast && isLast ? ADMIN_AMBER : 'rgba(214,213,201,0.35)';
        return (
          <div key={step.label}>
            <div className="flex items-end justify-between gap-4 text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
              <span>{step.label}</span>
              {stepConv != null && (
                <span className="text-ink-muted normal-case tracking-normal tabular-nums">
                  {stepConv.toFixed(1)}% of prior · {dropoff!.toFixed(1)}% drop
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: fill,
                  opacity: isLast ? 1 : 0.9,
                }}
              />
              <div className="text-[16px] font-medium text-timberwolf tabular-nums leading-none">
                {step.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
