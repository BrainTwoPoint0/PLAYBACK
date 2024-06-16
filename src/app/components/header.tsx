'use client';
import { motion } from 'framer-motion';
import { HeroHighlight, Highlight } from './ui/hero-highlight';

export function Header() {
  return (
    <HeroHighlight>
      <motion.h1
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: [20, -5, 0],
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        className="text-3xl px-4 md:text-6xl font-bold text-white max-w-5.5xl leading-relaxed lg:leading-snug text-center mx-auto "
      >

        <Highlight className="text-white">Access the Moment.</Highlight> Soon...
      </motion.h1>
    </HeroHighlight>
  );
}
