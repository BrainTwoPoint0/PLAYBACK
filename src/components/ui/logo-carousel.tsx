'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';

export interface Logo {
  name: string;
  src: string;
}

interface LogoColumnProps {
  logos: Logo[];
  index: number;
  currentTime: number;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const distributeLogos = (allLogos: Logo[], columnCount: number): Logo[][] => {
  const shuffled = shuffleArray(allLogos);
  const columns: Logo[][] = Array.from({ length: columnCount }, () => []);

  shuffled.forEach((logo, index) => {
    columns[index % columnCount].push(logo);
  });

  // Ensure each column has at least 2 logos for animation
  columns.forEach((column) => {
    while (column.length < 2) {
      column.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
    }
  });

  return columns;
};

const LogoColumn: React.FC<LogoColumnProps> = ({
  logos,
  index,
  currentTime,
}) => {
  const cycleInterval = 5000;
  const columnDelay = index * 200;
  const adjustedTime =
    (currentTime + columnDelay) % (cycleInterval * logos.length);
  const currentIndex = Math.floor(adjustedTime / cycleInterval);
  const currentLogo = logos[currentIndex % logos.length];

  return (
    <motion.div
      className="relative h-14 w-24 overflow-hidden md:h-24 md:w-48"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentLogo.name}-${currentIndex}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={{
            y: 20,
            opacity: 0,
            filter: 'blur(8px)',
          }}
          animate={{
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
          }}
          exit={{
            y: -20,
            opacity: 0,
            filter: 'blur(8px)',
          }}
          transition={{
            y: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.3 },
            filter: { duration: 0.3 },
          }}
        >
          <Image
            src={currentLogo.src}
            alt={currentLogo.name}
            width={120}
            height={80}
            className="h-14 w-auto max-w-[100px] object-contain opacity-75 md:h-24 md:max-w-[150px]"
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

interface LogoCarouselProps {
  logos: Logo[];
  columnCount?: number;
}

export function LogoCarousel({ logos, columnCount = 5 }: LogoCarouselProps) {
  const [columns, setColumns] = useState<Logo[][]>([]);
  const [time, setTime] = useState(0);

  const initializeColumns = useCallback(() => {
    setColumns(distributeLogos(logos, columnCount));
  }, [logos, columnCount]);

  useEffect(() => {
    initializeColumns();
  }, [initializeColumns]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center gap-4 py-8">
      {columns.map((columnLogos, index) => (
        <LogoColumn
          key={index}
          logos={columnLogos}
          index={index}
          currentTime={time}
        />
      ))}
    </div>
  );
}
