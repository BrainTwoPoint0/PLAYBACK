'use client';

import { SiteFooter } from '@braintwopoint0/playback-commons/ui';
import type { FooterColumnDef } from '@braintwopoint0/playback-commons/ui';

const columns: FooterColumnDef[] = [
  {
    title: 'Product',
    links: [
      { label: 'Academy', href: '/academy' },
      { label: 'Tournament', href: '/tournament' },
      { label: 'PLAYSCANNER', href: '/playscanner' },
      {
        label: 'PLAYHUB',
        href: 'https://playhub.playbacksports.ai',
        external: true,
      },
    ],
  },
  {
    title: 'Audiences',
    links: [
      { label: 'For clubs', href: '/#audiences' },
      { label: 'For players', href: '/academy' },
      { label: 'For coaches', href: '/#audiences' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Network', href: '/#network' },
      { label: 'Press', href: '/press' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Cookies', href: '/legal/cookies' },
    ],
  },
];

export default function Footer() {
  return <SiteFooter columns={columns} />;
}
