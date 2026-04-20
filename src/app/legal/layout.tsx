import type { ReactNode } from 'react';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen pt-[calc(var(--chrome-h,112px)+32px)] pb-24">
      <div className="mx-auto max-w-[720px] px-6 sm:px-10">{children}</div>
    </main>
  );
}
