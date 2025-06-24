import { BlogCard } from './blog-card';

interface BlogPostGridProps {
  posts: Array<{
    _id: string;
    title: string;
    slug: { current: string };
    coverImage: any;
    publishedAt: string;
    excerpt: string;
    categories?: Array<{ title: string }>;
  }>;
}

export function BlogPostGrid({ posts }: BlogPostGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {posts.map((post) => (
        <BlogCard
          key={post._id}
          title={post.title}
          coverImage={post.coverImage}
          publishedAt={post.publishedAt}
          excerpt={post.excerpt || ''}
          slug={post.slug.current}
          categories={post.categories}
        />
      ))}
    </div>
  );
}
