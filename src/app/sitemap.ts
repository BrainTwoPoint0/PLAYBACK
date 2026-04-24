import type { MetadataRoute } from 'next';
import { client } from '@/sanity/lib/client';

const SITE_URL = 'https://playbacksports.ai';

type SanityPressEntry = {
  slug: { current: string } | null;
  publishedAt: string | null;
  _updatedAt: string | null;
};

async function getPressEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const posts = await client.fetch<SanityPressEntry[]>(
      `*[_type == "pressRelease" && defined(slug.current)]{
        slug,
        publishedAt,
        _updatedAt
      }`,
      {},
      { next: { revalidate: 3600 } }
    );

    return posts
      .filter((p) => p.slug?.current)
      .map((p) => ({
        url: `${SITE_URL}/press/${p.slug!.current}`,
        lastModified: new Date(p._updatedAt ?? p.publishedAt ?? Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/playscanner`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/academy`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tournament`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/press`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/legal/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/cookies`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const pressEntries = await getPressEntries();

  return [...staticEntries, ...pressEntries];
}
