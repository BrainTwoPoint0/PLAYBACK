'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { InfiniteMovingCards } from './ui/infinite-moving-cards';
import SectionTitle from './ui/section-title';

const SPORT_CONFIG = [
  { key: 'basketball', image: '/sports/basketball.png' },
  { key: 'football', image: '/sports/football.png' },
  { key: 'volleyball', image: '/sports/volleyball.png' },
  { key: 'rugby', image: '/sports/rugby.png' },
  { key: 'tennis', image: '/sports/tennis.png' },
  { key: 'lacrosse', image: '/sports/lacrosse.png' },
  { key: 'padel', image: '/sports/padel.png' },
  { key: 'more', image: '/branding/PB-icon.png' },
] as const;

export function SportsList() {
  const t = useTranslations('landing.sports');

  const sportsList = SPORT_CONFIG.map(({ key, image }) => ({
    sportName: t(`items.${key}`),
    image,
  }));

  return (
    <section className="relative mt-32 md:mt-40">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle eyebrow={t('eyebrow')} title={t('title')} />
      </div>
      <div className="antialiased overflow-hidden">
        <InfiniteMovingCards
          items={sportsList}
          direction="right"
          speed="normal"
        />
      </div>
    </section>
  );
}
