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
import Image from 'next/image';
const PLAYBACKFont = localFont({
  src: '../../../public/fonts/playbackfont.ttf',
});

const navItems = [
  { href: '/academy', label: 'Academy' },
  // { href: '/league', label: 'League' },
  // { href: '/events', label: 'Events' },
  // { href: '/players', label: 'Players' },
  // { href: '/foundation', label: 'Foundation' },
];

export default function NavBar() {
  return (
    <nav className="container mx-auto flex p-5 items-center justify-center">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem className="md:hidden">
            <NavigationMenuTrigger className="px-3 py-6">
              <Image
                src="/branding/PLAYBACK-Text.png"
                alt="Menu"
                width={200}
                height={200}
                className="w-48 h-10"
              />
            </NavigationMenuTrigger>
            <NavigationMenuContent className="p-2 space-y-2 w-[14.4rem]">
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
    </nav>
  );
}
