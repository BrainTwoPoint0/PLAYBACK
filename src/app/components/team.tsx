import React from 'react';
import { AnimatedTooltip } from './ui/animated-tooltip';
import SectionTitle from './ui/section-title';

export default function Team() {
  const people = [
    {
      id: 1,
      name: 'Karim Fawaz',
      designation: 'Founder',
      image: '/team/karim.jpeg',
    },


  ];
  return (
    <section className="container my-5">
      <SectionTitle title="Here to Help" />
      <div className="flex flex-row flex-wrap items-center justify-center">
        <AnimatedTooltip items={people} />
      </div>
    </section>
  );
}
