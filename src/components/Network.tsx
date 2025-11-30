'use client';

import React from 'react';
import SectionTitle from './ui/section-title';
import { LogoCarousel, Logo } from './ui/logo-carousel';

const partnerLogos: Logo[] = [
  { name: 'Soccer Elite FA', src: '/network/SEFA.png' },
  { name: 'Maestros Academy UAE', src: '/network/maestros-logo.png' },
  { name: 'Manchester City', src: '/network/manchester-city-badge.png' },
  { name: 'GOALS', src: '/network/g-logo.png' },
  { name: 'DAFL', src: '/network/DAFL-logo.png' },
  { name: 'Atomics', src: '/network/AFC-Logo.svg' },
  { name: 'Complete Football Academy', src: '/partners/cfa.png' },
  { name: 'Hollands & Blair', src: '/network/h&b-logo.png' },
  { name: 'Maidstone United', src: '/network/maidstone-logo.png' },
  { name: 'Mezzie FC', src: '/network/mezzie.png' },
  { name: 'FC Athletica', src: '/network/athletica.png' },
  { name: 'Li3ib.com', src: '/network/li3ib.png' },
  { name: 'Suffix Management', src: '/network/suffix.png' },
  { name: 'YFL', src: '/network/yfl.png' },
  { name: 'The Sevens Stadium', src: '/network/sevens.png' },
  { name: 'AWS Cloud Cup Logo', src: '/network/aws-cc.png' },
];

export const Network = () => {
  return (
    <section className="container mt-20">
      <SectionTitle title="The Network" />
      <LogoCarousel logos={partnerLogos} columnCount={4} />
    </section>
  );
};
