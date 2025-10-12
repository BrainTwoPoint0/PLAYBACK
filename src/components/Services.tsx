'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Tabs } from './ui/tabs';
import { motion } from 'motion/react';
import SectionTitle from './ui/section-title';

export default function Services() {
  return (
    <div className="mt-20 rounded-md flex flex-col">
      <SectionTitle title="Services" />
      <ServicesTabs />
    </div>
  );
}

export function ServicesTabs() {
  const tabs = [
    {
      title: 'Academy',
      value: 'academy',
      content: (
        <Service
          title="PLAYBACK Academy"
          images={[
            '/showcase/veo-platform/platform-analytics.png',
            '/showcase/player-profile/player-highlights.png',
            '/showcase/veo-platform/platform-recordings.png',
            '/showcase/veo-platform/content-example-2.png',
            '/showcase/veo-platform/platform-teams.png',
            '/showcase/player-profile/player-positions.png',
            '/showcase/veo-platform/platform-metrics.png',
          ]}
          features={[
            { icon: ProfileIcon, text: 'Player Profiles' },
            { icon: ContentIcon, text: 'Match & Training Footage' },
            { icon: AIIcon, text: 'AI-Powered' },
            { icon: SocialMediaIcon, text: 'Social Media Sharing' },
            { icon: EcosystemIcon, text: 'Shared Ecosystem' },
            { icon: AnalyticsIcon, text: 'Analytics' },
          ]}
          callToAction={{
            text: 'Join Academy',
            link: '/academy',
          }}
        />
      ),
    },
    {
      title: 'Tournament',
      value: 'tournament',
      content: (
        <Service
          title="PLAYBACK Tournament Services"
          images={[
            '/showcase/pixellot/tournament-pixellot-content.png',
            '/showcase/pixellot/tournament-pixellot-games.png',
            '/showcase/pixellot/tournament-pixellot-content.png',
            '/showcase/pixellot/tournament-pixellot-games.png',
            '/showcase/pixellot/tournament-pixellot-content.png',
            '/showcase/pixellot/tournament-pixellot-games.png',
            '/showcase/pixellot/tournament-pixellot-content.png',
            '/showcase/pixellot/tournament-pixellot-games.png',
            '/showcase/pixellot/tournament-pixellot-content.png',
            '/showcase/pixellot/tournament-pixellot-games.png',
          ]}
          features={[
            { icon: ContentIcon, text: 'Tournament Match Footage' },
            { icon: AIIcon, text: 'AI-Powered' },
            { icon: SocialMediaIcon, text: 'Social Media Sharing' },
            { icon: EcosystemIcon, text: 'Shared Ecosystem' },
            { icon: AnalyticsIcon, text: 'Analytics' },
          ]}
          callToAction={{
            text: 'Access',
            link: '/tournament',
          }}
        />
      ),
    },
    // {
    //   title: 'More',
    //   value: 'more',
    //   content: (
    //     <Service
    //       title="Coming Soon..."
    //       images={[
    //         '/branding/PLAYBACK-icon.png',
    //         '/branding/simple-logo.png',
    //         '/branding/PLAYBACK-icon.png',
    //         '/branding/simple-logo.png',
    //         '/branding/PLAYBACK-icon.png',
    //         '/branding/simple-logo.png',
    //         '/branding/PLAYBACK-icon.png',
    //       ]}
    //       features={[
    //         { icon: TournamentIcon, text: 'Leagues & Tournaments' },
    //         { icon: ContentIcon, text: 'Footage & Content' },
    //         { icon: AIIcon, text: 'AI Detection' },
    //         { icon: SocialMediaIcon, text: 'Social Media Sharing' },
    //         { icon: CharityIcon, text: 'PLAYBACK Foundation' },
    //       ]}
    //       callToAction={{
    //         text: 'Reach Out',
    //         link: '/contact',
    //       }}
    //     />
    //   ),
    // },
  ];

  return (
    <div className="h-[25rem] md:h-[30rem] relative flex flex-col max-w-5xl mx-auto w-full px-4">
      <Tabs tabs={tabs} />
    </div>
  );
}

interface ServiceProps {
  title: string;
  images: string[];
  features: Array<{
    icon: React.ComponentType<{ className?: string }>;
    text: string;
  }>;
  callToAction: {
    text: string;
    link: string;
  };
}

const Service = ({ title, images, features, callToAction }: ServiceProps) => {
  return (
    <div className="flex flex-col justify-between h-full p-6 bg-[--night] border-4 border-[var(--ash-grey)] rounded-2xl overflow-hidden">
      <h4 className="text-lg md:text-2xl text-neutral-100 font-bold text-center mb-4">
        {title}
      </h4>
      <div className="flex justify-center items-center mb-6">
        {images.map((image, idx) => (
          <motion.div
            key={idx}
            style={{
              rotate: Math.random() * 20 - 10,
            }}
            whileHover={{
              scale: 1.1,
              rotate: 0,
              zIndex: 100,
            }}
            className="rounded-xl -mr-4 mt-4 p-1 bg-neutral-800 border-neutral-700 border flex-shrink-0 overflow-hidden"
          >
            <Image
              src={image}
              alt="PLAYBACK Service Images"
              width={160}
              height={160}
              className="rounded-lg h-20 w-20 md:h-40 md:w-40 object-cover flex-shrink-0"
            />
          </motion.div>
        ))}
      </div>
      <div className="flex gap-5 justify-center mb-5 text-[var(--ash-grey)] w-full overflow-scroll no-visible-scrollbar">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center justify-center">
            <div className="mr-2 h-5 w-5">
              <feature.icon className="h-5 w-5" />
            </div>
            <span className="text-xs text-center whitespace-nowrap overflow-hidden text-ellipsis w-full hidden md:block">
              {feature.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Link href={callToAction.link}>
          <button className="px-6 border-2 border-[var(--timberwolf)] py-2 bg-[var(--timberwolf)] text-black text-sm font-semibold rounded-md transition-colors duration-200 relative overflow-hidden group">
            <span className="group-hover:translate-x-40 text-center transition duration-500 inline-block">
              {callToAction.text}
            </span>
            <div className="-translate-x-40 group-hover:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 bg-[var(--night)] text-[var(--timberwolf)]">
              PLAYBACK
            </div>
          </button>
        </Link>
      </div>
    </div>
  );
};

const ProfileIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
      <line x1="7" y1="12" x2="17" y2="12"></line>
      <line x1="7" y1="16" x2="17" y2="16"></line>
      <circle cx="9" cy="8" r="2"></circle>
    </svg>
  );
};

const TournamentIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
    </svg>
  );
};

const ContentIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
    </svg>
  );
};

const AIIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
    </svg>
  );
};

const SocialMediaIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
};

const EcosystemIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
};

const AnalyticsIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
};

const CharityIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
};
