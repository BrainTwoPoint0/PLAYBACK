import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HoverEffect } from '@braintwopoint0/playback-commons/ui';
import SectionTitle from './ui/section-title';

export function TournamentSubscriptions() {
  const t = useTranslations('tournament.subscriptions');
  const items = [
    // Tournament names are data — never translated. Descriptions come from
    // tournament.subscriptions.items.*.
    {
      title: 'Ramadan Youth Cup 2025',
      description: t('items.ramadan'),
      link: 'https://buy.stripe.com/28o8Ab5R884Y0QUdR0',
      logoUrl: '/partners/city.svg',
    },
    {
      title: 'Atomics Tournament',
      description: t('items.atomics'),
      link: 'https://buy.stripe.com/14k4jVgvM84Y6be00b',
      logoUrl: '/partners/atomics.png',
    },
    {
      title: t('items.comingSoonTitle'),
      description: t('items.comingSoon'),
      link: '/',
      logoUrl: '/branding/PB-icon.png',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-8">
      <SectionTitle title={t('sectionTitle')} />
      <HoverEffect items={items} />
      <Link href="https://billing.stripe.com/p/login/cN29D13rV5X84UgdQQ">
        <button className="bg-gradient-to-br border border-neutral-400/[0.5] relative group/btn from-[var(--night)] to-[var(--night)] block bg-[var(--night)] w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]">
          {t('billing')}{' '}
          <span aria-hidden className="inline-block rtl:-scale-x-100">
            →
          </span>
          <BottomGradient />
        </button>
      </Link>

      <div className="my-4 " />
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-[var(--timberwolf)] to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-[var(--timberwolf)] to-transparent" />
    </>
  );
};
