import {
  InvalidTimeframeError,
  getPlayScannerAnalytics,
  parseTimeframe,
} from '@/lib/admin/playscanner-analytics';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

// Admin analytics is fully native now — no PostHog iframe. The native view
// is optimized for both desktop and mobile; PostHog is linked from the
// AnalyticsClient footer for deep-dive exploration only.
const POSTHOG_DEEP_DIVE_URL =
  'https://eu.posthog.com/project/159212/dashboard/642010';

export default async function AdminPlayscannerPage({
  searchParams,
}: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  // Admin is already enforced by src/app/admin/layout.tsx#requireAdmin.
  // This page trusts that gate and pulls data directly with the service-role
  // client — no public API surface, no client-side fetch round-trip.
  const { timeframe: rawTimeframe } = await searchParams;

  let timeframeDays: number;
  try {
    timeframeDays = parseTimeframe(rawTimeframe);
  } catch (err) {
    if (err instanceof InvalidTimeframeError) {
      return (
        <main className="min-h-screen bg-night text-timberwolf">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 pt-16">
            <div className="rounded-lg border border-[rgba(196,122,109,0.22)] bg-[rgba(196,122,109,0.05)] p-6 text-[#C47A6D] text-[13px]">
              {err.message}
            </div>
          </div>
        </main>
      );
    }
    throw err;
  }

  const analytics = await getPlayScannerAnalytics(timeframeDays);

  return (
    <main className="min-h-screen bg-night text-timberwolf">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 pb-16">
        <AnalyticsClient
          analytics={analytics}
          timeframeDays={timeframeDays}
          postHogDeepDiveUrl={POSTHOG_DEEP_DIVE_URL}
        />
      </div>
    </main>
  );
}
