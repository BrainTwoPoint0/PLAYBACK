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
      className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface-1 animate-pulse motion-reduce:animate-none"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="aspect-[4/3] bg-[rgba(214,213,201,0.04)]" />
      <div className="flex flex-col p-4 h-44">
        <div className="h-12 flex flex-col items-center justify-center gap-1.5">
          <div className="h-3.5 w-3/4 rounded bg-[rgba(214,213,201,0.06)]" />
          <div className="h-3.5 w-1/2 rounded bg-[rgba(214,213,201,0.06)]" />
        </div>
        <div className="h-10 mt-2 flex flex-col items-center justify-center gap-1.5">
          <div className="h-3 w-5/6 rounded bg-[rgba(214,213,201,0.04)]" />
          <div className="h-3 w-2/3 rounded bg-[rgba(214,213,201,0.04)]" />
        </div>
        <div className="flex-1" />
        <div className="h-6 flex items-center justify-between">
          <div className="h-5 w-16 rounded-full bg-[rgba(214,213,201,0.06)]" />
          <div className="h-3 w-20 rounded bg-[rgba(214,213,201,0.04)]" />
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
    <section id="news" className="relative mt-32 md:mt-40">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle eyebrow="Press" title="From London to the world." />
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : (
          <BlogPostGrid posts={posts} />
        )}
        <div className="flex justify-center mt-12">
          <Link
            href="/press"
            className="group inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-timberwolf text-night text-[14px] font-medium transition-colors hover:bg-ash-grey focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf focus-visible:ring-offset-2 focus-visible:ring-offset-night shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(0,0,0,0.35)]"
          >
            View all
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 motion-reduce:transition-none group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
