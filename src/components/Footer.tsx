'use client';

import Link from 'next/link';
import {
  FooterCreditsBar,
  NewsletterForm,
} from '@braintwopoint0/playback-commons/ui';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const columns: FooterColumn[] = [
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

function FooterLinkItem({ link }: { link: FooterLink }) {
  const classes =
    'text-[14px] text-ink-muted hover:text-timberwolf transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0';

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={classes}>
      {link.label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer
      id="footer"
      className="mt-24 border-t border-line bg-surface-0"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        PLAYBACK site footer
      </h2>
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <div className="flex flex-col gap-6 pt-16 pb-10 md:flex-row md:items-start md:justify-between md:gap-10 md:pt-20">
          <div className="max-w-[36ch]">
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-ink-subtle">
              Newsletter
            </p>
            <p className="mt-3 text-[17px] md:text-[19px] leading-[1.35] tracking-[-0.01em] text-timberwolf">
              Updates from the Network.
            </p>
            <p className="mt-2 text-[13px] leading-[1.5] text-ink-muted">
              Only when relevant. No spam.
            </p>
          </div>
          <div className="w-full md:max-w-md md:pt-1">
            <NewsletterForm />
          </div>
        </div>

        <div className="border-t border-line py-14">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="text-[12px] uppercase tracking-[0.14em] text-ink-subtle mb-4">
                  {col.title}
                </p>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.label}`}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <FooterCreditsBar />
      </div>
    </footer>
  );
}
