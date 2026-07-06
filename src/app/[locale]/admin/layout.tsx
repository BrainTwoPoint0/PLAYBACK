import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/utils';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

// Server component: runs requireAdmin() before rendering children. Not logged
// in → redirect to /auth/login. Logged in but profiles.is_admin = false →
// notFound() (404, no leak that /admin exists).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
