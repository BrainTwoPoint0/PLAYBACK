'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { About } from '@/components/About';
import Services from '@/components/Services';
import { Network } from '@/components/Network';
import Press from '@/components/Press';
import LatestNews from '@/components/LatestNews';
import { SportsList } from '@/components/SportsList';
import { ContactForm } from '@/components/Contact';

type LatestPost = {
  _id: string;
  title: string;
  slug: { current: string };
  coverImage: unknown;
  publishedAt: string;
  excerpt: string;
  categories?: Array<{ title: string }>;
};

export default function Home() {
  const [latestPosts, setLatestPosts] = useState<LatestPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts/latest', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) setLatestPosts(data);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error fetching latest posts:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
    return () => controller.abort();
  }, []);

  return (
    <main className="relative">
      <Header />
      <About />
      <Services />
      <Network />
      <Press />
      <LatestNews posts={latestPosts} loading={loading} />
      <SportsList />
      <ContactForm />
    </main>
  );
}
