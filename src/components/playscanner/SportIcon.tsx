'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface SportIconProps {
  sport: 'padel' | 'football' | 'tennis' | 'basketball';
  size?: number;
  className?: string;
}

export default function SportIcon({
  sport,
  size = 16,
  className = '',
}: SportIconProps) {
  const t = useTranslations('playscanner.search');
  const sportAssets: Record<string, string> = {
    padel: '/assets/tennis.svg',
    tennis: '/assets/tennis.svg',
    football: '/assets/football.svg',
    basketball: '/assets/basketball.svg',
  };
  const src = sportAssets[sport] || sportAssets.padel;

  return (
    <Image
      src={src}
      alt={t(`sports.${sport}`)}
      width={size}
      height={size}
      className={className}
    />
  );
}

/**
 * Returns raw HTML img tag for use in Leaflet markers (no React rendering).
 */
export function getSportIconHtml(
  sport: 'padel' | 'football' | 'tennis' | 'basketball',
  size = 14
): string {
  const srcMap: Record<string, string> = {
    football: '/assets/football.svg',
    basketball: '/assets/basketball.svg',
    padel: '/assets/tennis.svg',
    tennis: '/assets/tennis.svg',
  };
  const src = srcMap[sport] || '/assets/football.svg';
  return `<img src="${src}" width="${size}" height="${size}" alt="${sport}" style="display:block;" />`;
}
