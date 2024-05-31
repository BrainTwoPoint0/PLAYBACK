import React from 'react';
import { AnimatedTooltip } from './ui/animated-tooltip';

export default function Team() {
  const people = [
    {
      id: 1,
      name: 'Karim Fawaz',
      designation: 'Founder',
      image: '/team/karim.jpeg',
    },
    {
      id: 2,
      name: 'Tommaso di Gregorio',
      designation: 'Customer Acquisition',
      image: '/team/tommaso.jpeg',
    },
    {
      id: 3,
      name: 'Louis Gualda',
      designation: 'Operations',
      image: '/team/louis.jpeg',
    },
    {
      id: 4,
      name: 'Yuval Cole',
      designation: 'Operations',
      image: '/team/yuval.jpeg',
    },
  ];
  return (
    <section className="container flex justify-center items-center my-10">
      <h2 className="text-2xl font-bold mr-3">Here to Help: </h2>
      <div className="flex flex-row items-center justify-center">
        <AnimatedTooltip items={people} />
      </div>
    </section>
  );
}
