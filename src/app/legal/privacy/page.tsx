import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How PLAYBACK collects, uses, and protects your data.',
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none text-ink-muted">
      <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-ink-subtle mb-4">
        Legal
      </p>
      <h1 className="font-display font-semibold text-[clamp(32px,4vw,56px)] leading-[1.05] tracking-[-0.035em] text-timberwolf mb-2">
        Privacy Policy
      </h1>
      <p className="text-[13px] text-ink-subtle mb-12">
        Last updated: April 2026
      </p>

      <section className="space-y-6 text-[15px] leading-[1.65]">
        <p>
          This policy explains how{' '}
          <strong className="text-timberwolf">PLAYBACK Sports Ltd</strong>{' '}
          (company number 15638660, registered office 71-75 Shelton Street,
          Covent Garden, London, WC2H 9JQ) collects, uses, and protects your
          personal data when you use playbacksports.ai and the PLAYBACK
          platform. We are the data controller for personal data processed
          through the Service. We comply with the UK GDPR and the Data
          Protection Act 2018.
        </p>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Data we collect
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-timberwolf">Account data</strong> - email,
              name, username when you sign up.
            </li>
            <li>
              <strong className="text-timberwolf">Subscription data</strong> -
              academy subscriptions managed via Stripe. We do not store card
              details.
            </li>
            <li>
              <strong className="text-timberwolf">Match content</strong> -
              footage, highlights, and performance data (GPS, analytics) where
              your club has uploaded or connected it.
            </li>
            <li>
              <strong className="text-timberwolf">Newsletter</strong> - email
              address if you opt in via the website footer form.
            </li>
            <li>
              <strong className="text-timberwolf">Contact form data</strong> -
              name, email, company, role, and message when you submit the
              contact form.
            </li>
            <li>
              <strong className="text-timberwolf">Analytics</strong> -
              anonymised usage data to improve the product (via PostHog),
              including page views, feature usage, and session data.
            </li>
            <li>
              <strong className="text-timberwolf">
                PLAYSCANNER search data
              </strong>{' '}
              - search terms, filters applied, and click-throughs to provider
              sites. We also log hashed IP addresses for anti-abuse rate
              limiting.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Data we do not collect via PLAYSCANNER
          </h2>
          <p>
            PLAYSCANNER aggregates publicly available venue, slot, and pricing
            information from third-party providers. We do not collect personal
            data about the customers of those providers. When you click through
            from PLAYSCANNER to book a slot, you are redirected to the
            provider&rsquo;s own platform, which operates under its own privacy
            policy and terms. PLAYBACK does not receive or store the booking
            details you submit to third-party providers.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Children&rsquo;s data
          </h2>
          <p>
            PLAYBACK is used by clubs, academies, and youth leagues that include
            players under 18 and under 13. We take the UK GDPR and the
            ICO&rsquo;s Age Appropriate Design Code seriously.
          </p>
          <p className="mt-3">
            Where a child is enrolled in a PLAYBACK-powered club or academy,
            parental consent for processing the child&rsquo;s data is obtained
            by the club or academy as part of their registration, and PLAYBACK
            acts as a processor on the club&rsquo;s behalf for that data. Clubs
            are responsible for ensuring appropriate consent is in place before
            a child&rsquo;s data is uploaded to the platform.
          </p>
          <p className="mt-3">
            We apply data minimisation to children&rsquo;s data: we collect only
            what is necessary to deliver the Service, we do not use
            children&rsquo;s data for marketing, and we do not profile children
            for advertising purposes. Public display of a child&rsquo;s footage,
            highlights, or profile is controlled by the club and the parent /
            guardian; individual highlights and profiles are not made public by
            default. Parents or guardians may contact us at any time to request
            access, correction, or deletion of their child&rsquo;s data.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            How we use your data
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              To deliver the Service (account management, subscriptions, match
              content delivery, payment processing).
            </li>
            <li>
              To communicate with you about the Service and, where you have
              opted in, about product updates and partnerships.
            </li>
            <li>To improve the Service through anonymised analytics.</li>
            <li>To prevent abuse, fraud, and unauthorised access.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Legal bases
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-timberwolf">Contract</strong> - account
              and subscription data required to deliver the Service.
            </li>
            <li>
              <strong className="text-timberwolf">Legitimate interest</strong> -
              product updates to customers with active subscriptions; analytics
              for product improvement; anti-abuse logs; PLAYSCANNER search logs
              (rate limiting).
            </li>
            <li>
              <strong className="text-timberwolf">Consent</strong> - newsletter
              opt-ins via the website footer form (withdrawable at any time).
            </li>
            <li>
              <strong className="text-timberwolf">
                Processor on behalf of the club
              </strong>{' '}
              - children&rsquo;s data and match content processed under the
              consent the club obtained from the parent / guardian.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Processors and sub-processors
          </h2>
          <p>
            We use the following processors under Data Processing Agreements:
            Supabase (database, storage, auth), Stripe (payments), Resend
            (transactional + newsletter email), Vercel and Netlify (hosting),
            Sanity (CMS), PostHog (analytics), and Veo, Spiideo, PlayerData, and
            Clutch (match / performance data where connected by your club).
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Retention
          </h2>
          <p>
            Account data is kept while your account is active and for a
            reasonable period afterwards in case of reactivation. Newsletter
            data is kept until you unsubscribe. Match content is kept per the
            partnership agreement with your club. Anonymised analytics are kept
            up to 24 months. PLAYSCANNER search logs are kept up to 12 months
            for trend analysis and fraud prevention.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Your rights
          </h2>
          <p>
            Under UK GDPR you have the right to access, correct, delete, port,
            or restrict processing of your personal data, and to object to
            processing based on legitimate interest. Where processing is based
            on consent, you may withdraw it at any time. To exercise any right,
            email{' '}
            <a
              href="mailto:admin@playbacksports.ai"
              className="text-timberwolf hover:underline"
            >
              admin@playbacksports.ai
            </a>
            . You may also complain to the Information Commissioner&rsquo;s
            Office (ico.org.uk).
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            International transfers
          </h2>
          <p>
            Some processors (Resend, PostHog, Vercel) may transfer data outside
            the UK. Where they do, transfers are covered by the UK International
            Data Transfer Addendum, Standard Contractual Clauses, or an adequacy
            decision such as the UK-US Data Bridge, as applicable.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Security
          </h2>
          <p>
            We use industry-standard technical and organisational measures to
            protect personal data, including TLS in transit, encrypted storage,
            row-level security on our database, and principle-of-least-privilege
            access controls. No system is perfectly secure; we work continuously
            to improve and respond to threats.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Changes
          </h2>
          <p>
            Material changes to this policy will be notified via the Site or by
            email. Minor edits will show in the &ldquo;Last updated&rdquo; date
            above.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Contact
          </h2>
          <p>
            Data protection queries:{' '}
            <a
              href="mailto:admin@playbacksports.ai"
              className="text-timberwolf hover:underline"
            >
              admin@playbacksports.ai
            </a>
            . Postal: PLAYBACK Sports Ltd, 71-75 Shelton Street, Covent Garden,
            London, WC2H 9JQ, United Kingdom.
          </p>
        </div>
      </section>
    </article>
  );
}
