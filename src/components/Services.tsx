'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SectionTitle from './ui/section-title';

type Service = {
  eyebrow: string;
  title: string;
  body: string;
  features: string[];
  cta: { label: string; href: string };
  image: { src: string; alt: string };
};

const services: Service[] = [
  {
    eyebrow: 'PLAYBACK Academy',
    title: 'Every match, every moment, every player.',
    body: 'The subscription that turns an academy season into a professional-grade showcase. Match recordings, AI highlights, GPS data, and a player profile scouts can find.',
    features: [
      'AI-generated match highlights',
      'Player profile - LinkedIn for Sports',
      'PlayerData GPS: distance, speed, accelerations',
      'Match recordings via Veo, Spiideo, Clutch',
      'Parent-friendly sharing and scouting exposure',
    ],
    cta: { label: 'Join the Academy', href: '/academy' },
    image: {
      src: '/assets/PLAYBACK-Profiles.png',
      alt: 'PLAYBACK Player Profile - the LinkedIn for Sports surface',
    },
  },
  {
    eyebrow: 'PLAYBACK Tournament',
    title: 'Run the trophy day everyone remembers.',
    body: 'AI cameras, automatic match capture, and shareable clips for every fixture - the same tech trusted by Inter Milan, Roma, and Brentford. Charity cups to 11s leagues, covered.',
    features: [
      'Automated match capture per fixture',
      'AI highlight detection and clip export',
      'Live streaming and broadcast-grade output',
      'Team and player analytics',
      'Tournament branding and media hub',
    ],
    cta: { label: 'Host a tournament', href: '/tournament' },
    image: {
      src: '/assets/PLAYBACK-Tournament.png',
      alt: 'PLAYBACK-powered match broadcast from a tournament fixture',
    },
  },
];

export default function Services() {
  return (
    <section id="services" className="relative mt-32 md:mt-40">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle eyebrow="What we do" title="Elite tools, within reach." />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {services.map((s) => (
            <ServiceCard key={s.eyebrow} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="group relative flex flex-col rounded-2xl border border-line-strong bg-surface-1 overflow-hidden transition-colors duration-300 hover:border-timberwolf/30">
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2 border-b border-line-strong">
        <Image
          src={service.image.src}
          alt={service.image.alt}
          fill
          sizes="(min-width: 1024px) 600px, 100vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-col gap-6 p-7 md:p-8 flex-1">
        <div className="flex flex-col gap-3">
          <span className="text-[12px] uppercase tracking-[0.16em] text-ink-subtle">
            {service.eyebrow}
          </span>
          <h3 className="font-display font-semibold text-[clamp(22px,2.3vw,28px)] leading-[1.15] tracking-[-0.03em] text-timberwolf">
            {service.title}
          </h3>
          <p className="text-[15px] leading-[1.6] text-ink-muted">
            {service.body}
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {service.features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-3 text-[14px] text-ink-muted"
            >
              <span
                aria-hidden
                className="mt-[0.55rem] inline-block h-px w-4 bg-ash-grey flex-shrink-0"
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <Link
            href={service.cta.href}
            className="group/cta inline-flex items-center gap-2 h-11 px-5 rounded-full border border-line-strong text-timberwolf text-[14px] transition-colors hover:bg-surface-2 hover:border-timberwolf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
          >
            {service.cta.label}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
