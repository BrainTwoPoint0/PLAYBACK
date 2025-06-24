'use client';

import { ParallaxText } from '@/components/ParallaxText';
import { Header } from '@/components/Header';
import { Partners } from '@/components/Partners';
import { About } from '@/components/About';
import { SportsList } from '@/components/SportsList';
import Services from '@/components/Services';
import { ContactForm } from '@/components/Contact';
import Press from '@/components/Press';
import LatestNews from '@/components/LatestNews';
import { Suspense, useEffect, useState } from 'react';
import { Network } from '@/components/Network';

export default function Home() {
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts/latest');
        const data = await response.json();
        setLatestPosts(data);
      } catch (error) {
        console.error('Error fetching latest posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <main className="overflow-hidden">
      <Header />
      <About />
      <Network />
      <div className="mt-20">
        <ParallaxText baseVelocity={-3}>Access The Moment</ParallaxText>
        <ParallaxText baseVelocity={3}>Unlock your Potential</ParallaxText>
      </div>
      <Partners />
      <Services />
      <Press />
      <Suspense fallback={<div>Loading latest news...</div>}>
        {!loading && <LatestNews posts={latestPosts} />}
      </Suspense>
      <SportsList />
      <ContactForm />
    </main>
  );
}
