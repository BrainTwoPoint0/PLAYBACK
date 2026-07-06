import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ username: string }>;
}

/**
 * Backward-compat redirect. /player/[username] was the public profile route
 * before the connective-tissue refactor; canonical URL is now /p/[username].
 * 308 (permanent) preserves SEO link equity from any indexed legacy URLs.
 */
export default async function LegacyPlayerRedirect({ params }: PageProps) {
  const { username } = await params;
  permanentRedirect(`/p/${username}`);
}
