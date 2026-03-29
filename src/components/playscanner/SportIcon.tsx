'use client';

import Image from 'next/image';

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
  const sportAssets: Record<string, { src: string; alt: string }> = {
    padel: { src: '/assets/tennis.svg', alt: 'Padel' },
    tennis: { src: '/assets/tennis.svg', alt: 'Tennis' },
    football: { src: '/assets/football.svg', alt: 'Football' },
    basketball: { src: '/assets/football.svg', alt: 'Basketball' }, // TODO: add basketball.svg
  };
  const { src, alt } = sportAssets[sport] || sportAssets.padel;

  return (
    <Image
      src={src}
      alt={alt}
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
  const src =
    sport === 'football' || sport === 'basketball'
      ? '/assets/football.svg'
      : '/assets/tennis.svg';
  return `<img src="${src}" width="${size}" height="${size}" alt="${sport}" style="display:block;" />`;
}
