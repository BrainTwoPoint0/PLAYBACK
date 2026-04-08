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
  loading?: boolean;
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 animate-pulse"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="aspect-[4/3] bg-white/[0.04]" />
      <div className="flex flex-col p-4 h-44">
        <div className="h-12 flex flex-col items-center justify-center gap-1.5">
          <div className="h-3.5 w-3/4 rounded bg-white/[0.06]" />
          <div className="h-3.5 w-1/2 rounded bg-white/[0.06]" />
        </div>
        <div className="h-10 mt-2 flex flex-col items-center justify-center gap-1.5">
          <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
          <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
        </div>
        <div className="flex-1" />
        <div className="h-6 flex items-center justify-between">
          <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-20 rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export default function LatestNews({ posts, loading }: LatestNewsProps) {
  if (!loading && (!posts || posts.length === 0)) {
    return null;
  }

  return (
    <section className="container mt-20">
      <SectionTitle title="Latest News" />
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      ) : (
        <BlogPostGrid posts={posts} />
      )}
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
