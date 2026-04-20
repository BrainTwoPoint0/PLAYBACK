'use client';

import SectionTitle from './ui/section-title';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const pressLogos = [
  { name: 'WebSummit', src: '/media/websummit.png', className: 'w-32 h-32' },
  {
    name: 'Great British Entrepreneur Awards',
    src: '/media/GBEA.svg',
    className: 'w-40 h-40',
  },
  {
    name: 'World Football Summit',
    src: '/media/wfs.png',
    className: 'w-28 h-20',
  },
  {
    name: 'StartUp Awards',
    src: '/media/startup-awards.png',
    className: 'w-32 h-32',
  },
  { name: 'PSG Lab', src: '/media/PSG_LAB.png', className: 'w-40 h-40' },
  { name: 'SFS', src: '/media/SFS.png', className: 'w-44 h-44' },
  { name: 'UmmaHub', src: '/media/ummahub.png', className: 'w-40 h-40' },
  { name: 'Santander', src: '/media/santander.png', className: 'w-44 h-44' },
  { name: 'QMUL', src: '/media/QMUL.png', className: 'w-44 h-44' },
];

function InfiniteLogoSlider({
  items,
  direction = 'left',
  speed = 'normal',
}: {
  items: { name: string; src: string; className: string }[];
  direction?: 'left' | 'right';
  speed?: 'fast' | 'normal' | 'slow';
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prefersReduced = useReducedMotion();
  // SSR renders the animated flex-nowrap layout; after mount we honour
  // reduced-motion. Prevents hydration mismatch on first client render.
  const reducedMotion = mounted && Boolean(prefersReduced);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;
    if (reducedMotion) return; // Static render - don't duplicate or animate.

    const scrollerContent = Array.from(scrollerRef.current.children);
    scrollerContent.forEach((item) => {
      const duplicatedItem = item.cloneNode(true);
      if (scrollerRef.current) {
        scrollerRef.current.appendChild(duplicatedItem);
      }
    });

    containerRef.current.style.setProperty(
      '--animation-direction',
      direction === 'left' ? 'forwards' : 'reverse'
    );
    containerRef.current.style.setProperty(
      '--animation-duration',
      speed === 'fast' ? '20s' : speed === 'normal' ? '45s' : '80s'
    );

    setStart(true);
  }, [direction, speed, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="scroller relative z-20 w-full max-w-[1200px] overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]"
    >
      <ul
        ref={scrollerRef}
        className={cn(
          'flex min-w-full shrink-0 gap-12 w-max items-center',
          reducedMotion ? 'flex-wrap justify-center' : 'flex-nowrap',
          start && !reducedMotion && 'animate-scroll'
        )}
      >
        {items.map((item) => (
          <li key={item.name} className="flex items-center justify-center">
            <Image
              alt={item.name}
              src={item.src}
              height={100}
              width={100}
              className={cn(item.className, 'object-contain')}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Press() {
  return (
    <section id="press" className="relative mt-32 md:mt-40">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle
          eyebrow="Awards & recognition"
          title="Redefining the industry."
        />

        <div className="md:hidden flex justify-center">
          <InfiniteLogoSlider
            items={pressLogos}
            direction="left"
            speed="normal"
          />
        </div>

        <div className="hidden md:flex flex-wrap gap-x-16 gap-y-10 lg:gap-x-28 justify-center items-center">
          {pressLogos.map((logo) => (
            <Image
              key={logo.name}
              alt={logo.name}
              src={logo.src}
              height={100}
              width={100}
              className={cn(logo.className, 'object-contain')}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
