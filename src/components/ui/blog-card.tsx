'use client';

import Image from 'next/image';
import Link from 'next/link';
import { urlForImage } from '@/sanity/lib/image';
import { formatDateNumeric } from '@/lib/utils';
import { motion } from 'motion/react';

interface BlogCardProps {
  title: string;
  coverImage: any;
  publishedAt: string;
  excerpt: string;
  slug: string;
  categories?: Array<{ title: string }>;
}

export function BlogCard({
  title,
  coverImage,
  publishedAt,
  excerpt,
  slug,
  categories,
}: BlogCardProps) {
  return (
    <Link href={`/press/${slug}`}>
      <motion.div className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:border-zinc-700">
        {/* Fixed aspect ratio container for consistent image display */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {coverImage ? (
            <Image
              src={urlForImage(coverImage)}
              alt={title}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800">
              <span className="text-zinc-500">No image</span>
            </div>
          )}
        </div>

        {/* Fixed height content area for consistency */}
        <div className="flex flex-col p-4 h-44">
          {/* Title - fixed height for 2 lines, centered */}
          <div className="h-12 flex items-center justify-center">
            <h3 className="text-lg font-bold text-white transition-colors group-hover:text-[--timberwolf] line-clamp-2 leading-tight text-center">
              {title}
            </h3>
          </div>

          {/* Excerpt - fixed height for 2 lines, centered */}
          <div className="h-10 mt-2 flex items-center justify-center">
            <p className="text-sm text-zinc-400 line-clamp-2 text-center">
              {excerpt}
            </p>
          </div>

          {/* Spacer pushes category/date to bottom */}
          <div className="flex-1" />

          {/* Category and Date row - side by side at bottom */}
          <div className="h-6 flex items-center justify-between">
            {categories && categories.length > 0 ? (
              <div className="flex gap-2">
                {categories.slice(0, 1).map((category) => (
                  <span
                    key={category.title}
                    className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                  >
                    {category.title}
                  </span>
                ))}
              </div>
            ) : (
              <span />
            )}
            <span className="text-xs text-zinc-500">
              {formatDateNumeric(publishedAt)}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
