'use client';

import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Production-grade Edit Profile container. Slides in from the right on
 * desktop (≥sm: 540px width); fills the screen on mobile via the Sheet
 * primitive's responsive breakpoint. Keeps the existing ProfileEditForm
 * intact — this is just the surface, not a form rewrite.
 *
 * The default Sheet right-side variant scrolls the content overflow, which
 * is what we want for a long form. Header sticks to the top of the panel.
 */
export function EditProfileSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: EditProfileSheetProps) {
  const t = useTranslations('dashboard.page');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-[var(--night)] flex flex-col p-0 border-s"
        style={{ borderColor: 'var(--line-strong)' }}
      >
        <SheetHeader
          className="px-6 pt-6 pb-4 shrink-0 border-b"
          style={{ borderColor: 'var(--line)' }}
        >
          <SheetTitle className="text-[var(--timberwolf)]">
            {title ?? t('editProfileTitle')}
          </SheetTitle>
          {description ? (
            <SheetDescription className="text-[var(--ash-grey)]">
              {description}
            </SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
