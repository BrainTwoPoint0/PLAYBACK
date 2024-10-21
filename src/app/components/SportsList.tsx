'use client';

import React, { useEffect, useState } from 'react';
import { InfiniteMovingCards } from './ui/infinite-moving-cards';
import SectionTitle from './ui/section-title';

export function SportsList() {
  return (
    <div className="mt-36 mb-20 rounded-md flex flex-col antialiased items-center justify-center overflow-hidden">
      <SectionTitle title="Powered Sports" />
      <InfiniteMovingCards
        items={sportsList}
        direction="right"
        speed="normal"
      />
    </div>
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
