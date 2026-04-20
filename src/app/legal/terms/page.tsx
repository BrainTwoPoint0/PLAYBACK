import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - PLAYBACK',
  description: 'PLAYBACK Terms of Service',
};

export default function TermsPage() {
  return (
    <article className="prose prose-invert max-w-none text-ink-muted">
      <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-ink-subtle mb-4">
        Legal
      </p>
      <h1 className="font-display font-semibold text-[clamp(32px,4vw,56px)] leading-[1.05] tracking-[-0.035em] text-timberwolf mb-2">
        Terms of Service
      </h1>
      <p className="text-[13px] text-ink-subtle mb-12">
        Last updated: April 2026
      </p>

      <section className="space-y-6 text-[15px] leading-[1.65]">
        <p>
          These Terms govern your use of playbacksports.ai (the
          &ldquo;Site&rdquo;) and the PLAYBACK platform, including PLAYHUB,
          PLAYSCANNER, the Academy Service, and all related services (together,
          the &ldquo;Service&rdquo;). The Service is operated by{' '}
          <strong className="text-timberwolf">PLAYBACK Sports Ltd</strong>{' '}
          (company number 15638660), a company registered in England and Wales
          with registered office at 71-75 Shelton Street, Covent Garden, London,
          WC2H 9JQ (&ldquo;PLAYBACK&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;).
          By accessing or using the Service you agree to these Terms.
        </p>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Use of the Service
          </h2>
          <p>
            You may use the Service for lawful purposes only. You must not
            attempt to disrupt, reverse-engineer, or access parts of the Service
            you are not authorised to access. Organisations (clubs, academies,
            leagues, venues) remain responsible for their members&rsquo;
            compliance with these Terms on the platform.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Accounts and user content
          </h2>
          <p>
            You are responsible for activity under your account and for keeping
            your credentials secure. Content uploaded by clubs or players
            (&ldquo;User Content&rdquo;) remains owned by the uploader. By
            uploading User Content you grant PLAYBACK a worldwide, royalty-free,
            non-exclusive licence to host, process, display, and distribute it
            to authorised members of the PLAYBACK Network for the purpose of
            operating the Service. Full licensing terms for organisational
            content are agreed bilaterally in each partnership agreement.
          </p>
          <p className="mt-3">
            You must not upload User Content that infringes third-party rights,
            contains unlawful, abusive, or harmful material, or breaches the
            privacy of any individual. We may remove User Content that breaches
            these Terms.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Subscriptions and payments
          </h2>
          <p>
            Paid services (academy subscriptions, match recordings,
            infrastructure services) are billed via Stripe. Refund and
            cancellation terms are set per-club in the partnership agreement;
            contact your club or academy directly for questions about individual
            subscriptions. PLAYBACK&rsquo;s reduced-cost payment rails operate
            under Stripe&rsquo;s terms in addition to these Terms.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            PLAYSCANNER
          </h2>
          <p>
            PLAYSCANNER aggregates publicly available booking, slot, and pricing
            information from third-party sports venue providers (including but
            not limited to Playtomic, MATCHi, Padel Mates, PowerLeague, Goals,
            Footy Addicts, FC Urban, HireAPitch, Flow / Royal Parks, and
            OpenActive / Bookteq feeds) and presents it in one place so players
            can compare availability faster.
          </p>
          <p className="mt-3">
            PLAYSCANNER is a discovery tool. Data may be up to 60 minutes stale,
            and availability, pricing, and booking rules can change at any time.
            PLAYBACK does not warrant the accuracy, completeness, or timeliness
            of aggregated data. When you click through to book, the actual
            booking is completed on the provider&rsquo;s platform and is subject
            to that provider&rsquo;s terms, privacy policy, cancellation rules,
            and pricing - not PLAYBACK&rsquo;s.
          </p>
          <p className="mt-3">
            Provider names, logos, and trademarks referenced in PLAYSCANNER
            remain the property of their respective owners. PLAYBACK is not
            affiliated with or endorsed by every provider surfaced through
            PLAYSCANNER unless explicitly stated.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Intellectual property
          </h2>
          <p>
            The Service, including its software, design, text, graphics, and
            underlying technology, is owned by or licensed to PLAYBACK. All
            PLAYBACK platform intellectual property is owned by BRAIN 2.0 Ltd
            and licensed to PLAYBACK Sports Ltd for operation of the Service.
            Nothing in these Terms transfers ownership of any PLAYBACK
            intellectual property to you. You may not copy, modify, resell, or
            create derivative works from the Service without our prior written
            consent.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Third-party services
          </h2>
          <p>
            The Service integrates with third-party providers (including Veo,
            Spiideo, PlayerData, Clutch, Stripe, Supabase, and others). Your use
            of those providers through the Service is additionally subject to
            each provider&rsquo;s own terms. PLAYBACK does not control and is
            not responsible for third-party services beyond our direct operation
            of the Service.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Service availability
          </h2>
          <p>
            We aim for high availability but do not guarantee uninterrupted or
            error-free service. Planned maintenance will be announced where
            possible. We may suspend, limit, or discontinue features at any
            time.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Warranties and liability
          </h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo;. To the maximum extent permitted by law, PLAYBACK
            disclaims all warranties, express or implied, including warranties
            of merchantability, fitness for a particular purpose, and
            non-infringement. We do not warrant that the Service will be
            error-free, secure, or continuously available.
          </p>
          <p className="mt-3">
            To the maximum extent permitted by law, PLAYBACK&rsquo;s total
            aggregate liability to you arising out of or in connection with
            these Terms or the Service will not exceed the fees you paid to
            PLAYBACK in the twelve (12) months preceding the event giving rise
            to the claim. We are not liable for indirect, incidental, special,
            consequential, or punitive damages, or for loss of profits, revenue,
            data, or goodwill. Nothing in these Terms limits liability that
            cannot be limited under English law (including liability for death
            or personal injury caused by negligence, or for fraud).
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Termination
          </h2>
          <p>
            You may stop using the Service at any time. We may suspend or
            terminate your access if you materially breach these Terms, if your
            account is inactive for an extended period, or if continued
            provision of the Service to you would expose PLAYBACK to legal or
            regulatory risk. Sections relating to intellectual property,
            liability, and governing law survive termination.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Changes
          </h2>
          <p>
            We may update these Terms from time to time. Material changes will
            be notified via the Site or by email. Continued use of the Service
            after changes take effect constitutes acceptance.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            General
          </h2>
          <p>
            These Terms are governed by the laws of England and Wales. The
            courts of England and Wales have exclusive jurisdiction over any
            dispute arising out of or in connection with these Terms, save that
            PLAYBACK may bring proceedings against you in any jurisdiction where
            you are located.
          </p>
          <p className="mt-3">
            If any provision of these Terms is held to be unenforceable, the
            remaining provisions will remain in full force. Our failure to
            enforce a right is not a waiver of that right. Neither party is
            liable for delay or failure caused by events beyond its reasonable
            control (force majeure).
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Company information
          </h2>
          <p>
            PLAYBACK Sports Ltd is registered in England and Wales under company
            number 15638660. Registered office: 71-75 Shelton Street, Covent
            Garden, London, WC2H 9JQ, United Kingdom.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-timberwolf text-[20px] mt-10 mb-3">
            Contact
          </h2>
          <p>
            Legal questions:{' '}
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
