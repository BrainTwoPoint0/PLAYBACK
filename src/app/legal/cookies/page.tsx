import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How PLAYBACK uses cookies and similar technologies.',
  alternates: { canonical: '/legal/cookies' },
};

export default function CookiesPage() {
  return (
    <article className="prose prose-invert max-w-none text-ink-muted">
      <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-ink-subtle mb-4">
        Legal
      </p>
      <h1 className="font-display font-semibold text-[clamp(32px,4vw,56px)] leading-[1.05] tracking-[-0.035em] text-timberwolf mb-2">
        Cookie Policy
      </h1>
      <p className="text-[13px] text-ink-subtle mb-12">
        Last updated: April 2026
      </p>

      <section className="space-y-6 text-[15px] leading-[1.65]">
        <p>
          This page explains how{' '}
          <strong className="text-timberwolf">PLAYBACK Sports Ltd</strong>{' '}
          (company number 15638660) uses cookies and similar local-storage
          technologies on playbacksports.ai and across the PLAYBACK platform.
          For how we handle personal data more broadly, see our{' '}
          <a href="/legal/privacy" className="text-timberwolf hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Strictly necessary
          </h2>
          <p>
            We use cookies that are essential for the Service to function:
            authentication session tokens (Supabase), CSRF protection, and load
            balancing. These do not require consent under UK GDPR and PECR
            because they are strictly necessary to deliver the Service you
            requested.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Preferences
          </h2>
          <p>
            We store small flags in your browser&rsquo;s localStorage to
            remember UI preferences - for example, whether you dismissed the
            site-wide announcement bar. These are first-party and do not track
            you across sites.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Analytics
          </h2>
          <p>
            We use PostHog for product analytics. PostHog is configured to
            respect &ldquo;Do Not Track&rdquo; where supported and to anonymise
            IP addresses. PostHog may set first-party cookies for session
            grouping. PLAYSCANNER additionally logs anonymised search terms and
            click-throughs to help us improve venue coverage.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Third-party services
          </h2>
          <p>
            Embedded services (Stripe checkout, Sanity Studio, Veo / Spiideo
            video players where configured, and third-party booking redirects
            from PLAYSCANNER) set their own cookies subject to their respective
            policies.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Controlling cookies
          </h2>
          <p>
            Most browsers let you block or delete cookies. Disabling strictly
            necessary cookies will break parts of the Service (you won&rsquo;t
            be able to sign in). See{' '}
            <a
              href="https://allaboutcookies.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-timberwolf hover:underline"
            >
              allaboutcookies.org
            </a>{' '}
            for browser-specific instructions.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Contact
          </h2>
          <p>
            Questions about cookies or tracking:{' '}
            <a
              href="mailto:admin@playbacksports.ai"
              className="text-timberwolf hover:underline"
            >
              admin@playbacksports.ai
            </a>
            .
          </p>
        </div>
      </section>
    </article>
  );
}
