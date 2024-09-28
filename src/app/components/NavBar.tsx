'use client';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/app/components/ui/navigation-menu';
import localFont from 'next/font/local';
import * as React from 'react';
import Link from 'next/link';

const PLAYBACKFont = localFont({
  src: '../../../public/fonts/playbackfont.ttf',
});

const navItems = [
  { href: '/academy', label: 'Academy' },
  // { href: "/tournaments", label: "Tournaments" },
];

export default function NavBar() {
  return (
    <nav className="container mx-auto flex p-5 items-center justify-between">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem className="md:hidden">
            <NavigationMenuTrigger className="px-3 py-6">
              <span
                className={`${PLAYBACKFont.className} text-[var(--ash-grey)] text-2xl`}
              >
                PLAYBACK
              </span>
            </NavigationMenuTrigger>
            <NavigationMenuContent className="p-2 space-y-2 w-[10.25rem]">
              <NavigationMenuItem>
                <Link href="/">
                  <NavigationMenuLink
                    className={`${navigationMenuTriggerStyle()}`}
                  >
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {navItems.map(({ href, label }) => (
                <NavigationMenuItem key={label}>
                  <Link href={href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`${navigationMenuTriggerStyle()}`}
                    >
                      {label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/" className="font-medium hidden md:block">
              <span
                className={`${PLAYBACKFont.className} text-[var(--ash-grey)] text-2xl`}
              >
                PLAYBACK
              </span>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuList className="hidden md:flex mr-auto ml-4 py-1 pl-4 border-l border-[var(--timberwolf)] items-center text-lg justify-center">
            {navItems.map(({ href, label }) => (
              <NavigationMenuItem key={label}>
                <Link href={href} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenuList>
      </NavigationMenu>

      <Link
        href="/contact"
        className="text-[var(--night)] inline-flex items-center bg-[var(--ash-grey)] border-0 py-3 px-3 focus:outline-none hover:bg-[var(--timberwolf)] rounded text-base "
      >
        PLAY W/ US
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="w-4 h-4 ml-1"
          viewBox="0 0 24 24"
        >
          {' '}
          <path d="M5 12h14M12 5l7 7-7 7"></path>
        </svg>
      </Link>
    </nav>
  );
}
