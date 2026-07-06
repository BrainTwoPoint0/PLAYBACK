import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, HoverEffect } from '@braintwopoint0/playback-commons/ui';
import SectionTitle from './ui/section-title';

export function AcademySubscriptions() {
  const t = useTranslations('academy.subscriptions');
  const items = teams.map(({ descriptionKey, ...team }) => ({
    ...team,
    description: t(`clubs.${descriptionKey}`),
  }));

  return (
    <div className="max-w-5xl mx-auto px-8">
      <SectionTitle title={t('sectionTitle')} />
      <HoverEffect items={items} />
      <Link href="https://billing.stripe.com/p/login/cN29D13rV5X84UgdQQ">
        <Button variant="playback" className="w-full">
          {t('billing')}{' '}
          <span aria-hidden className="inline-block rtl:-scale-x-100">
            →
          </span>
        </Button>
      </Link>

      <div className="my-4 " />
    </div>
  );
}

// Titles are club/partner names (data — never translated). Descriptions are
// looked up from academy.subscriptions.clubs.* at render time.
export const teams = [
  {
    // Unlike the other partners (which link out to Stripe Payment Links),
    // LYL uses the unified PLAYBACK academy flow — link is internal so
    // parents land on /academy/lyl and pick their club + age group, then
    // checkout + claim-account happens via the integrated D1/D2 flow.
    title: 'London Youth League',
    descriptionKey: 'lyl',
    link: '/academy/lyl',
    logoUrl: '/partners/lyl.png',
  },
  {
    title: 'Soccer Elite FA',
    descriptionKey: 'sefa',
    link: 'https://buy.stripe.com/14keYz1AS5WQ0QU5km',
    logoUrl: '/partners/soccerelite.svg',
  },
  {
    title: 'Complete Football Academy',
    descriptionKey: 'cfa',
    link: 'https://buy.stripe.com/28obMn1ASdpi1UY9AJ',
    logoUrl: '/partners/cfa.png',
  },
  {
    title: 'Maestros Academy',
    descriptionKey: 'maestros',
    link: 'https://buy.stripe.com/eVa8AbdjA5WQczCbIP',
    logoUrl: '/partners/maestros.png',
  },
  {
    title: 'Hollands & Blair',
    descriptionKey: 'hb',
    link: 'https://buy.stripe.com/9AQdUv4N484Y0QU5kn',
    logoUrl: '/partners/hb.png',
  },
  {
    title: 'Maidstone United',
    descriptionKey: 'maidstone',
    link: 'https://buy.stripe.com/3cs6s30wO992eHKdQU',
    logoUrl: '/partners/maidstone.svg',
  },
  {
    title: 'Soccer Elite FA Women',
    descriptionKey: 'sefaWomen',
    link: 'https://buy.stripe.com/cN26s393kgBuczC8wC',
    logoUrl: '/partners/soccerelite.svg',
  },
] as const;
