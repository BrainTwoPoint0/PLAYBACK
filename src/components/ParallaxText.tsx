'use client';
import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from 'framer-motion';
import { wrap } from '@motionone/utils';

interface ParallaxProps {
  children: string;
  baseVelocity: number;
}

export function ParallaxText({ children, baseVelocity = 100 }: ParallaxProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  // Calculate the width of the text span
  const textRef = useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.offsetWidth);
    }
  }, [children]);

  // Dynamic wrapping based on text width and viewport width
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const repeatCount =
    textWidth > 0 ? Math.ceil(viewportWidth / textWidth) + 2 : 1; // Increase by 2 for better coverage

  const x = useTransform(baseX, (v) => `${wrap(-100 / repeatCount, 0, v)}%`);

  const directionFactor = useRef<number>(1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden whitespace-nowrap flex ">
      <motion.div
        className="font-bold text-3xl md:text-7xl uppercase flex"
        style={{ x }}
      >
        {Array.from({ length: repeatCount }).map((_, i) => (
          <span key={i} className="mr-8" ref={i === 0 ? textRef : null}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
