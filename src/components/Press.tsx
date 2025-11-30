'use client';

import SectionTitle from './ui/section-title';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      if (direction === 'left') {
        containerRef.current.style.setProperty(
          '--animation-direction',
          'forwards'
        );
      } else {
        containerRef.current.style.setProperty(
          '--animation-direction',
          'reverse'
        );
      }

      if (speed === 'fast') {
        containerRef.current.style.setProperty('--animation-duration', '20s');
      } else if (speed === 'normal') {
        containerRef.current.style.setProperty('--animation-duration', '45s');
      } else {
        containerRef.current.style.setProperty('--animation-duration', '80s');
      }

      setStart(true);
    }
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className="scroller relative z-20 max-w-[90vw] overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]"
    >
      <ul
        ref={scrollerRef}
        className={cn(
          'flex min-w-full shrink-0 gap-12 w-max flex-nowrap items-center',
          start && 'animate-scroll'
        )}
      >
        {items.map((item) => (
          <li key={item.name} className="flex items-center justify-center">
            <Image
              alt={`${item.name} Logo`}
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
    <section className="container mt-36">
      <SectionTitle title="Global Recognition" />

      {/* Mobile: Infinite sliding animation */}
      <div className="md:hidden flex justify-center">
        <InfiniteLogoSlider
          items={pressLogos}
          direction="left"
          speed="normal"
        />
      </div>

      {/* Desktop: Static grid */}
      <div className="hidden md:flex flex-wrap gap-16 md:gap-x-36 justify-center items-center">
        <Image
          alt="WebSummit Logo"
          src="/media/websummit.png"
          height={100}
          width={100}
          className="md:w-32 md:h-32 object-contain"
        />
        <Image
          alt="Great British Entrepreneur Awards Logo"
          src="/media/GBEA.svg"
          height={100}
          width={100}
          className="md:w-40 md:h-40 object-contain"
        />
        <Image
          alt="World Football Summit Logo"
          src="/media/wfs.png"
          height={100}
          width={100}
          className="md:w-28 md:h-20 object-contain"
        />
        <Image
          alt="StartUp Awards Logo"
          src="/media/startup-awards.png"
          height={100}
          width={100}
          className="md:w-32 md:h-32 object-contain"
        />
        <Image
          alt="SFS Logo"
          src="/media/SFS.png"
          height={100}
          width={100}
          className="md:w-44 md:h-44 object-contain"
        />
        <Image
          alt="UmmaHub Logo"
          src="/media/ummahub.png"
          height={100}
          width={100}
          className="md:w-40 md:h-40 object-contain"
        />
        <Image
          alt="Santander Logo"
          src="/media/santander.png"
          height={100}
          width={100}
          className="md:w-44 md:h-44 object-contain"
        />
        <Image
          alt="QMUL Logo"
          src="/media/QMUL.png"
          height={100}
          width={100}
          className="md:w-44 md:h-44 object-contain"
        />
      </div>
    </section>
  );
}
