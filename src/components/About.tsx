import React from 'react';
import { cn } from '@playback/commons/lib';
import Image from 'next/image';
import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { IconBrandYoutubeFilled } from '@tabler/icons-react';
import Link from 'next/link';
import SectionTitle from './ui/section-title';
import Statistics from './Statistics';

export function About() {
  const features = [
    {
      title: 'You PLAY - We BACK',
      description:
        'PLAYBACK is a solutions aggregator powering sports clubs, leagues, tournaments, academies, players, analysts, agents, scouts, and fans. Using curated partnerships, in-house software, and AI-powered equipment, PLAYBACK is commercialising access to premium services by suppressing financial and operational burdens.',
      skeleton: <SkeletonOne />,
      className:
        'col-span-1 lg:col-span-4 border-b lg:border-r border-neutral-800 h-full',
    },
    {
      title: 'Premium Partners',
      description:
        'PLAYBACK leverages its network of partners to provide you with top of the line products and services within a business model promoting growth and development.',
      skeleton: <SkeletonTwo />,
      className: 'border-b col-span-1 lg:col-span-2 border-neutral-800',
    },
    {
      title: 'Share the Moment',
      description:
        'PLAYBACK social media accounts help you stay updated on the latest news and watch streams & highlights.',
      skeleton: <SkeletonThree />,
      className: 'col-span-1 lg:col-span-3 lg:border-r border-neutral-800',
    },
    {
      title: 'Scaling Worldwide',
      description:
        'The PLAYBACK Network includes sports organisations in 6 countries, with partners pending onboarding in 12 more countries.',
      skeleton: <SkeletonFour />,
      className: 'col-span-1 lg:col-span-3 border-b lg:border-none',
    },
  ];
  return (
    <div className="relative z-20 my-12 max-w-7xl mx-auto">
      <SectionTitle title="About" />

      <div className="relative ">
        <div className="grid grid-cols-1 lg:grid-cols-6 mt-12 xl:border rounded-md border-neutral-800">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className=" max-w-5xl mx-auto text-left tracking-tight text-white text-xl md:text-2xl md:leading-snug">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        'text-sm md:text-base text-left mx-auto',
        'text-center font-normal text-neutral-300',
        'text-left mx-0 md:text-sm my-2'
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex py-3 px-2">
      <div className="w-full p-5 mx-auto">
        <div className="flex w-full flex-col space-y-2 ">
          <Statistics />
        </div>
      </div>
    </div>
  );
};

export const SkeletonTwo = () => {
  const imagesFirst = [
    '/showcase/veo-platform/platform-analytics.png',
    '/showcase/player-profile/player-highlights.png',
    '/showcase/veo-platform/platform-recordings.png',
    '/showcase/veo-platform/content-example-2.png',
    '/branding/simple-logo.png',
  ];

  const imagesSecond = [
    '/showcase/veo-platform/platform-teams.png',
    '/showcase/player-profile/player-positions.png',
    '/branding/PLAYBACK-Icon.png',
    '/showcase/veo-platform/platform-metrics.png',
    '/showcase/subscriptions/subscription-options.png',
  ];

  const imageVariants = {
    whileHover: {
      scale: 1.1,
      rotate: 0,
      zIndex: 100,
    },
    whileTap: {
      scale: 1.1,
      rotate: 0,
      zIndex: 100,
    },
  };
  return (
    <div className="relative flex flex-col justify-center items-center p-8 gap-6 overflow-hidden">
      <div className="flex flex-row justify-center items-center md:hidden">
        {imagesFirst.map((image, idx) => (
          <motion.div
            key={'images-first' + idx}
            style={{
              rotate: Math.random() * 20 - 10,
            }}
            variants={imageVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="rounded-xl -mr-4 mt-4 p-1 bg-neutral-800 border-neutral-700 border flex-shrink-0 overflow-hidden"
          >
            <Image
              src={image}
              alt="PLAYBACK Service Images"
              width="300"
              height="300"
              className="rounded-lg h-20 w-20 md:h-32 md:w-32 object-cover flex-shrink-0"
            />
          </motion.div>
        ))}
      </div>
      <div className="flex flex-row justify-center items-center">
        {imagesSecond.map((image, idx) => (
          <motion.div
            key={'images-second' + idx}
            style={{
              rotate: Math.random() * 20 - 10,
            }}
            variants={imageVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="rounded-xl -mr-4 mt-4 p-1 bg-neutral-800 border-neutral-700 border flex-shrink-0 overflow-hidden"
          >
            <Image
              src={image}
              alt="PLAYBACK Service Images"
              width="300"
              height="300"
              className="rounded-lg h-20 w-20 md:h-32 md:w-32 object-cover flex-shrink-0"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonThree = () => {
  return (
    <Link
      href="https://www.youtube.com/shorts/YxtmxB-BaT8"
      target="__blank"
      className="relative flex group/image"
    >
      <div className="w-full mx-auto bg-transparent group ">
        <div className="flex flex-1 w-full justify-center items-center flex-col space-y-2 relative">
          <IconBrandYoutubeFilled className="h-20 w-20 absolute z-10 inset-0 text-red-500 m-auto " />
          <Image
            src="/showcase/veo-platform/content-example-2.png"
            alt="header"
            width={600}
            height={500}
            className="aspect-square object-cover object-center rounded-sm blur-none group-hover/image:blur-md transition-all duration-200"
          />
        </div>
      </div>
    </Link>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="h-60 md:h-60  flex flex-col items-center relative bg-transparent mt-10">
      <Globe className="absolute -right-10 md:-right-10 -bottom-80 md:-bottom-72" />
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // longitude latitude
        { location: [51.37178860433438, 0.561636584656944], size: 0.06 }, // Kent
        { location: [41.07904357011636, 29.022866484615545], size: 0.04 }, //TURKEY
        { location: [24.39766023964695, 54.53680134963848], size: 0.04 }, // UAE
        { location: [29.3117, 47.4818], size: 0.04 }, // KUWAIT
        { location: [48.8575, 2.3514], size: 0.04 }, // PARIS
        { location: [26.4207, 50.0888], size: 0.04 }, // DAMMAM
        { location: [24.7136, 46.6753], size: 0.04 }, // RIYADH
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 600, height: 600, maxWidth: '100%', aspectRatio: 1 }}
      className={className}
    />
  );
};
