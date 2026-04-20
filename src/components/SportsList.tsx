'use client';

import React, { useEffect, useState } from 'react';
import { InfiniteMovingCards } from './ui/infinite-moving-cards';
import SectionTitle from './ui/section-title';

export function SportsList() {
  return (
    <section className="relative mt-32 md:mt-40">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle
          eyebrow="Sports powered"
          title="For every sport, every pitch."
        />
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

const sportsList = [
  {
    sportName: 'Basketball',
    image: '/sports/basketball.png',
  },
  {
    sportName: 'Football',
    image: '/sports/football.png',
  },
  {
    sportName: 'Volleyball',
    image: '/sports/volleyball.png',
  },
  {
    sportName: 'Rugby',
    image: '/sports/rugby.png',
  },
  {
    sportName: 'Tennis',
    image: '/sports/tennis.png',
  },
  {
    sportName: 'Lacrosse',
    image: '/sports/lacrosse.png',
  },
  {
    sportName: 'Padel',
    image: '/sports/padel.png',
  },
  {
    sportName: '& More',
    image: '/branding/PB-icon.png',
  },
];
