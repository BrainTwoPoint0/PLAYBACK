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
      <motion.div className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface-1 transition-colors duration-300 hover:border-line-strong">
        <div className="relative aspect-[4/3] overflow-hidden">
          {coverImage ? (
            <Image
              src={urlForImage(coverImage)}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-2">
              <span className="text-[12px] uppercase tracking-[0.16em] text-ink-subtle">
                No image
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col p-4 h-44">
          <div className="h-12 flex items-center justify-center">
            <h3 className="text-[16px] font-medium tracking-[-0.01em] text-timberwolf line-clamp-2 leading-tight text-center transition-colors group-hover:text-ash-grey">
              {title}
            </h3>
          </div>

          <div className="h-10 mt-2 flex items-center justify-center">
            <p className="text-[13px] leading-[1.4] text-ink-muted line-clamp-2 text-center">
              {excerpt}
            </p>
          </div>

          <div className="flex-1" />

          <div className="h-6 flex items-center justify-between">
            {categories && categories.length > 0 ? (
              <div className="flex gap-2">
                {categories.slice(0, 1).map((category) => (
                  <span
                    key={category.title}
                    className="inline-flex items-center rounded-full border border-line px-2.5 py-0.5 text-[11px] uppercase tracking-[0.12em] text-ink-muted"
                  >
                    {category.title}
                  </span>
                ))}
              </div>
            ) : (
              <span />
            )}
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
              {formatDateNumeric(publishedAt)}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
