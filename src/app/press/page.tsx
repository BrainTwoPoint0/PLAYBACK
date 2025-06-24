import { Metadata } from 'next';
import { client } from '@/sanity/lib/client';
import { BlogPostGrid } from '@/components/ui/blog-post-grid';

export const metadata: Metadata = {
  title: 'Press & News | PLAYBACK',
  description: 'Latest news, press releases, and announcements from PLAYBACK',
};

async function getAllPressReleases() {
  const posts = await client.fetch(
    `*[_type == "pressRelease"] | order(publishedAt desc){
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    coverImage,
    categories[]->{
      title
    }
  }`,
    {},
    { next: { revalidate: 0 } }
  );

  return posts;
}

export default async function PressPage() {
  const posts = await getAllPressReleases();

  return (
    <div className="container py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Press & News</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Stay updated with the latest news, press releases, and announcements
          from PLAYBACK.
        </p>
      </div>

      {posts.length > 0 ? (
        <BlogPostGrid posts={posts} />
      ) : (
        <div className="text-center py-12">
          <p className="text-zinc-400">No press releases found.</p>
        </div>
      )}
    </div>
  );
}
