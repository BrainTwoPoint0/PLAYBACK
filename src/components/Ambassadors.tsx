'use client';
import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { CanvasRevealEffect } from '@playback/commons/components/ui/canvas-reveal-effect';
import SectionTitle from './ui/section-title';

export function Ambassadors() {
  return (
    <section className="container mt-20 mb-20">
      <SectionTitle title="Ambassadors" />
      <div className="flex flex-col lg:flex-row items-center justify-center w-full gap-4 mx-auto px-8">
        <div className="border group/canvas-card flex items-center justify-center border-white/[0.2]  max-w-sm w-full mx-auto p-4 relative h-[20rem] md:h-[30rem]">
          <Icon className="absolute h-6 w-6 -top-3 -left-3" />
          <Icon className="absolute h-6 w-6 -bottom-3 -left-3" />
          <Icon className="absolute h-6 w-6 -top-3 -right-3" />
          <Icon className="absolute h-6 w-6 -bottom-3 -right-3" />
          <AnimatePresence>
            <div className="h-full w-full absolute inset-0">
              <CanvasRevealEffect
                animationSpeed={3}
                containerClassName="bg-[var(--night)]"
                colors={[
                  [5, 207, 255],
                  [4, 22, 66],
                  [255, 255, 255],
                ]}
                dotSize={2}
              />
            </div>
          </AnimatePresence>
          <div className="relative z-20">
            <div className="text-center w-full  mx-auto flex items-center justify-center">
              <img src="/ambassadors/lee-spiller.png" />
            </div>
            <h2 className="text-xl relative z-10 mt-4 font-bold text-white text-center">
              Lee Spiller
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

const Card = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div className="border group/canvas-card flex items-center justify-center border-white/[0.2]  max-w-sm w-full mx-auto p-4 relative h-[30rem]">
      <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white" />

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full absolute inset-0"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20">
        <div className="text-center group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0 transition duration-200 w-full  mx-auto flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-white text-xl opacity-0 group-hover/canvas-card:opacity-100 relative z-10 mt-4  font-bold group-hover/canvas-card:text-white group-hover/canvas-card:-translate-y-2 transition duration-200">
          {title}
        </h2>
      </div>
    </div>
  );
};

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};
