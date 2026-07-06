'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import SectionTitle from './ui/section-title';

type Service = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  features: string[];
  cta: { label: string; href: string };
  image: { src: string; alt: string };
};

const SERVICE_CONFIG = [
  {
    key: 'academy',
    ctaHref: '/academy',
    imageSrc: '/assets/PLAYBACK-Profiles.png',
  },
  {
    key: 'tournament',
    ctaHref: '/tournament',
    imageSrc: '/assets/PLAYBACK-Tournament.png',
  },
] as const;

const FEATURE_COUNT = 5;

export default function Services() {
  const t = useTranslations('landing.services');

  const services: Service[] = SERVICE_CONFIG.map(
    ({ key, ctaHref, imageSrc }) => ({
      key,
      eyebrow: t(`${key}.eyebrow`),
      title: t(`${key}.title`),
      body: t(`${key}.body`),
      features: Array.from({ length: FEATURE_COUNT }, (_, i) =>
        t(`${key}.feature${i + 1}`)
      ),
      cta: { label: t(`${key}.cta`), href: ctaHref },
      image: { src: imageSrc, alt: t(`${key}.imageAlt`) },
    })
  );

  return (
    <section id="services" className="relative mt-32 md:mt-40">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle eyebrow={t('eyebrow')} title={t('title')} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {services.map((s) => (
            <ServiceCard key={s.key} service={s} />
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
              className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-0.5 rtl:rotate-180"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
