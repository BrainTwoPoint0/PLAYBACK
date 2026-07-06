import Image from 'next/image';
import React from 'react';
import { useTranslations } from 'next-intl';
import { Timeline } from './ui/timeline';
import { Link } from '@/i18n/navigation';

export function AcademyOnboarding() {
  const t = useTranslations('academy.onboarding');
  const data = [
    {
      entryTitle: t('signUpTitle'),
      entryContent: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-8">
            {t('signUpBody')}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/subscriptions/subscription-options.png"
              alt={t('signUpAltOptions')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/subscriptions/subscription-form.png"
              alt={t('signUpAltForm')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
          </div>
        </div>
      ),
    },
    {
      entryTitle: t('accessTitle'),
      entryContent: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-8">
            {t.rich('accessBody', {
              link: (chunks) => (
                <Link
                  href="https://app.veo.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/veo-platform/platform-teams.png"
              alt={t('accessAlt')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/platform-metrics.png"
              alt={t('accessAlt')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/platform-analytics.png"
              alt={t('accessAlt')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/platform-recordings.png"
              alt={t('accessAlt')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
          </div>
        </div>
      ),
    },
    {
      entryTitle: t('profileTitle'),
      entryContent: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-6">
            {t('profileBody')}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/player-profile/about-player.png"
              alt={t('profileAltAbout')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/player-profile/player-highlights.png"
              alt={t('profileAltHighlights')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/player-profile/player-information.png"
              alt={t('profileAltInformation')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/player-profile/player-positions.png"
              alt={t('profileAltPositions')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
          </div>
        </div>
      ),
    },
    {
      entryTitle: t('contentTitle'),
      entryContent: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-6 w-full">
            {t('contentBody')}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/showcase/veo-platform/content-example-2.png"
              alt={t('contentAlt')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/content-example-1.png"
              alt={t('contentAlt')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/content-example-4.png"
              alt={t('contentAlt')}
              width={500}
              height={500}
              className="border border-[--timberwolf] rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
            <Image
              src="/showcase/veo-platform/content-example-3.png"
              alt={t('contentAlt')}
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
      <Timeline data={data} title={t('title')} description={t('description')} />
    </div>
  );
}
