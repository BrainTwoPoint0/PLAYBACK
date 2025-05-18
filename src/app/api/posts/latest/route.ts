import { client } from '@/sanity/lib/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const posts = await client.fetch(
      `*[_type == "pressRelease"] | order(publishedAt desc)[0...4]{
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

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
