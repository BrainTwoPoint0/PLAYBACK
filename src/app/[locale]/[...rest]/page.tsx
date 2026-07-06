import { notFound } from 'next/navigation';

// Catch-all so unknown paths 404 inside the locale layout (localized chrome
// + translated NotFound copy) instead of falling through to a bare error.
export default function CatchAllNotFound() {
  notFound();
}
