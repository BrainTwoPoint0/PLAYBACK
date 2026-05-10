'use client';

interface DashboardSectionProps {
  /** Short uppercase eyebrow displayed in the section heading */
  title: string;
  /** Right-aligned secondary action (e.g. "Manage", "View all") */
  action?: React.ReactNode;
  /** Optional small count chip rendered next to the title */
  count?: number | null;
  children: React.ReactNode;
}

/**
 * Standard layout primitive for dashboard sections. Establishes a consistent
 * page rhythm: uppercase title with hairline rule trailing it, optional right
 * action, and roomy vertical spacing between sections handled by the parent.
 *
 * The hairline rule pattern matches `DashboardFeed` bucket headings — use
 * this primitive instead of bespoke headings to keep the typography lock-step.
 */
export function DashboardSection({
  title,
  action,
  count,
  children,
}: DashboardSectionProps) {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-3">
        <h2
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold shrink-0"
          style={{ color: 'var(--ash-grey)' }}
        >
          <span>{title}</span>
          {count !== null && count !== undefined && count > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full px-1.5 text-[10px] tabular-nums font-medium"
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-muted)',
              }}
            >
              {count}
            </span>
          )}
        </h2>
        <span
          className="flex-1 h-px"
          style={{ backgroundColor: 'var(--line)' }}
          aria-hidden
        />
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
    </section>
  );
}
