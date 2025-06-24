'use client';

import { PortableText as SanityPortableText } from '@portabletext/react';
import Image from 'next/image';
import { urlForImage } from '@/sanity/lib/image';

interface PortableTextProps {
  value: any[];
}

const components = {
  types: {
    image: ({ value }: any) => {
      return (
        <figure className="my-8">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={urlForImage(value)}
              alt={value.alt || ''}
              fill
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-zinc-400">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  marks: {
    link: ({ children, value }: any) => {
      const rel = !value.href.startsWith('/')
        ? 'noreferrer noopener'
        : undefined;
      return (
        <a
          href={value.href}
          rel={rel}
          className="text-[--timberwolf] underline"
        >
          {children}
        </a>
      );
    },
  },
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-bold mt-6 mb-3">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-bold mt-4 mb-2">{children}</h4>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-zinc-700 pl-4 italic my-6">
        {children}
      </blockquote>
    ),
    normal: ({ children }: any) => {
      if (children && children.length === 1 && children[0] === '') {
        return <p className="min-h-[1.5em]">&nbsp;</p>;
      }
      return <p className="my-4">{children}</p>;
    },
  },
};

export function PortableText({ value }: PortableTextProps) {
  if (!value) {
    return null;
  }

  return (
    <div className="prose prose-invert prose-zinc max-w-none">
      <SanityPortableText value={value} components={components} />
    </div>
  );
}
