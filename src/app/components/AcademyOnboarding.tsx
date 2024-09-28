import Image from 'next/image';
import React from 'react';
import { Timeline } from './ui/timeline';

export function AcademyOnboarding() {
  const data = [
    {
      entryTitle: 'Sign Up',
      entryContent: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Select your academy from the PLAYBACK Academy Services list below
            and sign up for a subscription. Once you have signed up, you will be
            able invited to the ClubHouse to access the platform and access your
            match footage & data.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/subscriptions/subscription-options.png"
              alt="Subscription Options"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/subscriptions/subscription-form.png"
              alt="Subscription Form"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
          </div>
        </div>
      ),
    },
    {
      entryTitle: 'Access',
      entryContent: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Following succcessful onboarding to the PLAYBACK ClubHouse, you will
            be able to access your team&apos;s data, content, and analytics.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/veo-platform/platform-teams.png"
              alt="Platform Example"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/platform-metrics.png"
              alt="Platform Example"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/platform-analytics.png"
              alt="Platform Example"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/platform-recordings.png"
              alt="Platform Example"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
          </div>
        </div>
      ),
    },
    {
      entryTitle: 'Profile',
      entryContent: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-6">
            Players will be able to create their Player Profile which will be
            used as a repository of the player&apos;s details, stats, and
            highlights. Shareable via link.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/player-profile/about-player.png"
              alt="Player Profile - About"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/player-profile/player-highlights.png"
              alt="Player Profile - Highlights"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/player-profile/player-information.png"
              alt="Player Profile - Information"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/player-profile/player-positions.png"
              alt="Player Profile - Positions"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
          </div>
        </div>
      ),
    },
    {
      entryTitle: 'Content',
      entryContent: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-6">
            Onboarded players & parents can access their team&apos;s footage,
            create clips, add highlights to the Player Profile, share content,
            and interact with the coaching staff via @ mentions to discuss plays
            and celebrate achievements.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/veo-platform/content-example-2.png"
              alt="Content Platform Example"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/content-example-1.png"
              alt="Content Platform Example"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/content-example-4.png"
              alt="Content Platform Example"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/content-example-3.png"
              alt="Content Platform Example"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
          </div>
        </div>
      ),
    },
  ];
  return (
    <div className="w-full">
      <Timeline
        data={data}
        title="Academy Onboarding"
        description="By partnering with leading academies, players, parents, and staff can now have a shared ecosystem where growth is promoted. POWERED by PLAYBACK."
      />
    </div>
  );
}
