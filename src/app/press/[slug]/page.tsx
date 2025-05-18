import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { urlForImage } from '@/sanity/lib/image';
import { formatDate } from '@/lib/utils';
import { PortableText } from '@/app/components/ui/portable-text';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found | PLAYBACK',
    };
  }

  return {
    title: `${post.title} | PLAYBACK`,
    description: post.excerpt,
    openGraph: {
      images: post.coverImage ? [urlForImage(post.coverImage)] : [],
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
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container py-16">
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
                className="object-cover"
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
