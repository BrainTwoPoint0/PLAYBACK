'use client';

import { BlogPostGrid } from './ui/blog-post-grid';
import SectionTitle from './ui/section-title';
import Link from 'next/link';

interface LatestNewsProps {
  posts: Array<{
    _id: string;
    title: string;
    slug: { current: string };
    coverImage: any;
    publishedAt: string;
    excerpt: string;
    categories?: Array<{ title: string }>;
  }>;
}

export default function LatestNews({ posts }: LatestNewsProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="container mt-20">
      <SectionTitle title="Latest News" />
      <BlogPostGrid posts={posts} />
      <div className="flex justify-center mt-8">
        <Link href="/press" className="relative">
          <button className="px-6 border-2 border-[var(--timberwolf)] py-2 bg-[var(--timberwolf)] text-black text-sm font-semibold rounded-md transition-colors duration-200 relative overflow-hidden group">
            <span className="group-hover:translate-x-40 text-center transition duration-500 inline-block">
              View All &rarr;
            </span>
            <div className="-translate-x-40 group-hover:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 bg-[var(--night)] text-[var(--timberwolf)]">
              PLAYBACK
            </div>
          </button>
        </Link>
      </div>
    </section>
  );
}
