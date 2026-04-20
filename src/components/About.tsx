'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SectionTitle from './ui/section-title';

type Audience = {
  eyebrow: string;
  headline: string;
  body: string;
  bullets: string[];
  cta: { label: string; href: string };
};

const audiences: Audience[] = [
  {
    eyebrow: 'For clubs & academies',
    headline: 'The last partner you\u2019ll ever need.',
    body: 'AI, software, media, and cloud - all built in-house. Layered on top of best-in-class hardware from the likes of Veo, Spiideo, and Clutch. One operating system for every team, season, and venue.',
    bullets: [
      'In-house AI, software, and cloud architecture',
      'Media automations - clips, graphics, distribution',
      'Elite hardware included - Veo, Spiideo, Clutch, GameCam, Hudl, FairVision, PlayerData',
      'Performance-based model - we grow together',
    ],
    cta: { label: 'Join the Network', href: '/#contact' },
  },
  {
    eyebrow: 'For players & parents',
    headline: 'Access the Moment.',
    body: 'Our AI captures every match, clips every goal, and builds the profile scouts can actually find. The same tech pros rely on, put to work for the 99% who play.',
    bullets: [
      'AI-generated highlights, delivered in minutes',
      'PLAYBACK Profile - the LinkedIn for Sports',
      'GPS, analytics, and match graphics built in',
      '25 trials secured through PLAYBACK profiles',
    ],
    cta: { label: 'Join the Academy', href: '/academy' },
  },
  {
    eyebrow: 'For coaches & staff',
    headline: 'Video, GPS, Ops - one stack.',
    body: 'Our software replaces the six tools most coaches stitch together. Tagging, analytics, clip distribution, player data - one interface, built by us to work together.',
    bullets: [
      'AI match tagging and instant video breakdowns',
      'GPS, events, and benchmarks per player',
      'AI-native processes for ops automation',
      'Automated clip delivery to players and parents',
    ],
    cta: { label: 'See the platform', href: '/#services' },
  },
];

export function About() {
  return (
    <section id="audiences" className="relative mt-32 md:mt-40">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle eyebrow="Built for" title="One Network. Every side." />
        <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-3">
          {audiences.map((a) => (
            <AudienceCard key={a.eyebrow} audience={a} />
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
            className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}
