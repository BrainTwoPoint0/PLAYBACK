import type { Metadata } from 'next';
import { NotFound } from '@braintwopoint0/playback-commons/ui';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFoundPage() {
  return (
    <NotFound
      brand="PLAYBACK"
      ctaLabel="Back to dashboard"
      ctaHref="/dashboard"
      links={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Find a court', href: '/playscanner' },
      ]}
    />
  );
}
