import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--timberwolf)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-[var(--timberwolf)] bg-[var(--timberwolf)] text-black',
        secondary:
          'border-[var(--ash-grey)]/20 bg-[var(--ash-grey)]/10 text-[var(--timberwolf)]',
        destructive: 'border-red-500/20 bg-red-500/10 text-red-400',
        outline: 'border-[var(--timberwolf)] text-[var(--timberwolf)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
