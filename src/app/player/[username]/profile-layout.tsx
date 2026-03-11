'use client';

import { FadeIn } from '@/components/FadeIn';

export function ProfileLayout({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return <FadeIn delay={delay}>{children}</FadeIn>;
}
