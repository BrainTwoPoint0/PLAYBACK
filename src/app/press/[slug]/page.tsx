import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { urlForImage } from '@/sanity/lib/image';
import { formatDate } from '@/lib/utils';
import { PortableText } from '@/components/ui/portable-text';
import { JsonLd } from '@/components/JsonLd';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://playbacksports.ai';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const url = `/press/${slug}`;
  const image = post.coverImage ? urlForImage(post.coverImage) : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.excerpt,
      siteName: 'PLAYBACK',
      publishedTime: post.publishedAt,
      images: image ? [{ url: image, alt: post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: image ? [image] : undefined,
    },
  };
}

async function getPostBySlug(slug: string) {
  const post = await client.fetch(
    `*[_type == "pressRelease" && slug.current == $slug][0]{
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      coverImage,
      content,
      categories[]->{
        title
      }
    }`,
    { slug },
    { next: { revalidate: 0 } }
  );

  return post;
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const canonicalUrl = `${APP_URL}/press/${slug}`;
  const imageUrl = post.coverImage ? urlForImage(post.coverImage) : undefined;

  const newsArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    url: canonicalUrl,
    image: imageUrl ? [imageUrl] : undefined,
    articleSection: post.categories?.map((c: { title: string }) => c.title),
    publisher: { '@id': `${APP_URL}/#organization` },
    isPartOf: { '@id': `${APP_URL}/#website` },
  };

  return (
    <article className="container py-16">
      <JsonLd data={newsArticleSchema} />
      <Link
        href="/press"
        className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to all news
      </Link>

      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center text-sm text-zinc-400 mb-6">
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>

            {post.categories && post.categories.length > 0 && (
              <>
                <span className="mx-2">•</span>
                <div className="flex flex-wrap gap-2">
                  {post.categories.map((category: { title: string }) => (
                    <span
                      key={category.title}
                      className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                    >
                      {category.title}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {post.coverImage && (
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={urlForImage(post.coverImage)}
                alt={post.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
        </header>

        <PortableText value={post.content} />
      </div>
    </article>
  );
}
