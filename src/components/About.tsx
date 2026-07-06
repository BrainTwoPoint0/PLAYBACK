'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import SectionTitle from './ui/section-title';

type Audience = {
  key: string;
  eyebrow: string;
  headline: string;
  body: string;
  bullets: string[];
  cta: { label: string; href: string };
};

const AUDIENCE_CONFIG = [
  { key: 'clubs', ctaHref: '/#contact' },
  { key: 'players', ctaHref: '/academy' },
  { key: 'coaches', ctaHref: '/#services' },
] as const;

const BULLET_COUNT = 4;

export function About() {
  const t = useTranslations('landing.about');

  const audiences: Audience[] = AUDIENCE_CONFIG.map(({ key, ctaHref }) => ({
    key,
    eyebrow: t(`audiences.${key}.eyebrow`),
    headline: t(`audiences.${key}.headline`),
    body: t(`audiences.${key}.body`),
    bullets: Array.from({ length: BULLET_COUNT }, (_, i) =>
      t(`audiences.${key}.bullet${i + 1}`)
    ),
    cta: { label: t(`audiences.${key}.cta`), href: ctaHref },
  }));

  return (
    <section id="audiences" className="relative mt-32 md:mt-40">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle eyebrow={t('eyebrow')} title={t('title')} />
        <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-3">
          {audiences.map((a) => (
            <AudienceCard key={a.key} audience={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceCard({ audience }: { audience: Audience }) {
  return (
    <article className="group relative flex flex-col gap-6 rounded-2xl border border-line-strong p-7 md:p-8 transition-colors duration-300 hover:border-timberwolf/30">
      <div className="flex flex-col gap-4">
        <span className="text-[12px] uppercase tracking-[0.16em] text-ink-subtle">
          {audience.eyebrow}
        </span>
        <h3 className="font-display font-semibold text-[clamp(20px,2vw,24px)] leading-[1.15] tracking-[-0.03em] text-timberwolf text-balance">
          {audience.headline}
        </h3>
        <p className="text-[15px] leading-[1.6] text-ink-muted">
          {audience.body}
        </p>
      </div>
      <ul className="flex flex-col gap-2 border-t border-line pt-5">
        {audience.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-3 text-[14px] text-ink-muted"
          >
            <span
              aria-hidden
              className="mt-[0.55rem] inline-block h-px w-4 bg-ash-grey flex-shrink-0"
            />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-2">
        <Link
          href={audience.cta.href}
          className="group/link inline-flex items-center gap-2 text-[14px] text-timberwolf rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
        >
          {audience.cta.label}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-0.5 rtl:rotate-180"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}
