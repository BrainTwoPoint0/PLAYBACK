import Link from 'next/link';
import { Button, HoverEffect } from '@braintwopoint0/playback-commons/ui';
import SectionTitle from './ui/section-title';

export function AcademySubscriptions() {
  return (
    <div className="max-w-5xl mx-auto px-8">
      <SectionTitle title="PLAYBACK Academy Services" />
      <HoverEffect items={teams} />
      <Link href="https://billing.stripe.com/p/login/cN29D13rV5X84UgdQQ">
        <Button variant="playback" className="w-full">
          Billing Management &rarr;
        </Button>
      </Link>

      <div className="my-4 " />
    </div>
  );
}
export const teams = [
  {
    title: 'Soccer Elite FA',
    description:
      'With venue coverage at Star Meadow Sports Complex, SEFA players now have access to the PLAYBACK services.',
    link: 'https://buy.stripe.com/14keYz1AS5WQ0QU5km',
    logoUrl: '/partners/soccerelite.svg',
  },
  {
    title: 'Complete Football Academy',
    description:
      'JPL & Mezzie Youth teams can now access the PLAYBACK services across their venues.',
    link: 'https://buy.stripe.com/28obMn1ASdpi1UY9AJ',
    logoUrl: '/partners/cfa.png',
  },
  {
    title: 'Maestros Academy',
    description:
      'Select Maestros Academy teams can now access the PLAYBACK services across both of their venues.',
    link: 'https://buy.stripe.com/eVa8AbdjA5WQczCbIP',
    logoUrl: '/partners/maestros.png',
  },
  {
    title: 'Hollands & Blair',
    description:
      'Select Hollands & Blair teams are able to utilize the PLAYBACK infrastructure to access their match footage at Star Meadow Sports Complex.',
    link: 'https://buy.stripe.com/9AQdUv4N484Y0QU5kn',
    logoUrl: '/partners/hb.png',
  },
  {
    title: 'Maidstone United',
    description:
      'We have partnered with Maidstone United to provide their players with the PLAYBACK Academy service.',
    link: 'https://buy.stripe.com/3cs6s30wO992eHKdQU',
    logoUrl: '/partners/maidstone.svg',
  },
  {
    title: 'Soccer Elite FA Women',
    description:
      'With venue coverage at Star Meadow Sports Complex, SEFA Women players now have access to the PLAYBACK services.',
    link: 'https://buy.stripe.com/cN26s393kgBuczC8wC',
    logoUrl: '/partners/soccerelite.svg',
  },
  // {
  //   title: 'Coming Soon',
  //   description:
  //     'The PLAYBACK team is continuously working on onboarding new venues and academies. If you would like to be part of the PLAYBACK ecosystem, REACH OUT!',
  //   link: '/contact',
  //   logoUrl: '/branding/PB-icon.png',
  // },
];
