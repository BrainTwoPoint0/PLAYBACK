import Image from 'next/image';
import React from 'react';
import { Timeline } from './ui/timeline';

export function TournamentOnboarding() {
  const data = [
    {
      entryTitle: 'Sign Up',
      entryContent: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Select your tournament from the PLAYBACK Tournament Services list
            below and sign up for a subscription. Upon successful sign up, you
            will receive an email with a link to the tournament folder/all games
            within 24 hours.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/subscriptions/tournament-options.png"
              alt="Tournament Subscription Options"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/subscriptions/tournament-subscription-form.png"
              alt="Tournament Subscription Form"
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
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-6 w-full">
            Onboarded players & parents can access their team&apos;s footage,
            create clips, export highlights, share content, and celebrate
            achievements.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/pixellot/tournament-pixellot-games.png"
              alt="Content Platform Example"
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/pixellot/tournament-pixellot-content.png"
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
        title="Tournament Onboarding"
        description="Players, parents, and staff can now have a shared platform moments are shared and memories are preserved. POWERED by PLAYBACK."
      />
    </div>
  );
}
