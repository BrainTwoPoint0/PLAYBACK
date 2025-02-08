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
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const navItems = [
  { href: '/academy', label: 'Academy' },
  { href: '/leagues', label: 'Leagues', disabled: true },
  { href: '/events', label: 'Events', disabled: true },
  { href: '/players', label: 'Players', disabled: true },
  { href: '/foundation', label: 'Foundation', disabled: true },
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
                alt="PLAYBACK Logo"
                width={200}
                height={200}
                className="w-40 h-8"
              />
            </NavigationMenuTrigger>
            <NavigationMenuContent className="p-2 space-y-2 w-[13.13rem]">
              <NavigationMenuItem>
                <Link href="/">
                  <NavigationMenuLink
                    className={`${navigationMenuTriggerStyle()}`}
                  >
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {navItems
                .filter((item) => !item.disabled)
                .map(({ href, label }) => (
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
              <Image
                src="/branding/PLAYBACK-Text.png"
                alt="PLAYBACK Logo"
                width={200}
                height={200}
                className="w-32 h-7"
              />
            </Link>
          </NavigationMenuItem>
          <NavigationMenuList className="hidden md:flex mr-auto ml-4 py-1 pl-4 border-l border-[var(--timberwolf)] items-center text-lg justify-center">
            {navItems.map(({ href, label, disabled }) => (
              <NavigationMenuItem key={label}>
                {disabled ? (
                  <span
                    className={`${navigationMenuTriggerStyle()} opacity-50 cursor-not-allowed`}
                  >
                    {label}
                  </span>
                ) : (
                  <Link href={href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      {label}
                    </NavigationMenuLink>
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
