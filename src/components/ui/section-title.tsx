import React from 'react';
import { cn } from '@/lib/utils';

type SectionTitleProps = {
  title: string;
  eyebrow?: string;
  align?: 'left' | 'center';
  className?: string;
};

export default function SectionTitle({
  title,
  eyebrow,
  align = 'left',
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 mb-12 md:mb-16',
        align === 'center' && 'items-center text-center',
        className
      )}
    >
      {eyebrow ? (
        <span className="text-[12px] uppercase tracking-[0.16em] text-ink-subtle">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-[clamp(26px,4.5vw,60px)] font-semibold leading-[1.05] tracking-[-0.035em] text-timberwolf">
        {title}
      </h2>
    </div>
  );
}
