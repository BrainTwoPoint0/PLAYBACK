'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SiteFooter } from '@braintwopoint0/playback-commons/ui';
import type { FooterColumnDef } from '@braintwopoint0/playback-commons/ui';

export default function Footer() {
  const t = useTranslations('footer');

  const columns: FooterColumnDef[] = useMemo(
    () => [
      {
        title: t('product.title'),
        links: [
          { label: t('product.academy'), href: '/academy' },
          { label: t('product.tournament'), href: '/tournament' },
          { label: t('product.playscanner'), href: '/playscanner' },
          {
            label: t('product.playhub'),
            href: 'https://playhub.playbacksports.ai',
            external: true,
          },
        ],
      },
      {
        title: t('audiences.title'),
        links: [
          { label: t('audiences.forClubs'), href: '/#audiences' },
          { label: t('audiences.forPlayers'), href: '/academy' },
          { label: t('audiences.forCoaches'), href: '/#audiences' },
        ],
      },
      {
        title: t('company.title'),
        links: [
          { label: t('company.network'), href: '/#network' },
          { label: t('company.press'), href: '/press' },
          { label: t('company.contact'), href: '/#contact' },
        ],
      },
      {
        title: t('legal.title'),
        links: [
          { label: t('legal.terms'), href: '/legal/terms' },
          { label: t('legal.privacy'), href: '/legal/privacy' },
          { label: t('legal.cookies'), href: '/legal/cookies' },
        ],
      },
    ],
    [t]
  );

  return <SiteFooter columns={columns} />;
}
