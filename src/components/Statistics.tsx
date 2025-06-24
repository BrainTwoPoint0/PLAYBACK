'use client';
import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Statistics() {
  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
      <Card title="Players Powered" stat={20000} className="md:mt-[2rem]" />
      <Card
        title="Saved by Partners"
        stat={450000}
        className="md:w-[24rem]"
        formatAsMoney
      />
      <Card title="Teams Onboarded" stat={200} className="md:mt-[2rem]" />
    </div>
  );
}

const Card = ({
  title,
  stat,
  className,
  formatAsMoney = false,
}: {
  title?: string;
  stat: number;
  className?: any;
  formatAsMoney?: boolean;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    if (isInView) {
      const increment = stat / 100;
      let count = 0;
      const interval = setInterval(() => {
        count += increment;
        if (count >= stat) {
          setCurrentStat(stat);
          clearInterval(interval);
        } else {
          setCurrentStat(Math.floor(count));
        }
      }, 25);
    }
  }, [isInView, stat]);

  const formattedStat = formatAsMoney
    ? `${currentStat.toLocaleString()} $`
    : currentStat.toLocaleString();

  return (
    <motion.div
      ref={ref}
      className={cn(
        'w-[20rem] h-[150px] border border-[var(--timberwolf)] rounded-md text-center flex flex-col justify-center gap-y-4 items-center',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0 }}
      transition={{ duration: 1.5 }}
    >
      <h3 className="font-bold text-4xl">{formattedStat}</h3>
      <span>{title}</span>
    </motion.div>
  );
};
