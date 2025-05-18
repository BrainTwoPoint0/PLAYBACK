'use client';

import Image from 'next/image';
import Link from 'next/link';
import { urlForImage } from '@/sanity/lib/image';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

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
      <motion.div className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:border-zinc-700 h-80">
        <div className="relative h-48 overflow-hidden">
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

        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            {categories && categories.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category.title}
                    className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                  >
                    {category.title}
                  </span>
                ))}
              </div>
            )}

            <h3 className="mb-2 text-xl font-bold text-white transition-colors group-hover:text-[--timberwolf]">
              {title}
            </h3>

            <p className="line-clamp-2 text-sm text-zinc-400">{excerpt}</p>
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            {formatDate(publishedAt)}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
