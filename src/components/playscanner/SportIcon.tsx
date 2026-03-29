'use client';

import Image from 'next/image';

interface SportIconProps {
  sport: 'padel' | 'football';
  size?: number;
  className?: string;
}

export default function SportIcon({
  sport,
  size = 16,
  className = '',
}: SportIconProps) {
  const src =
    sport === 'football' ? '/assets/football.svg' : '/assets/tennis.svg';
  const alt = sport === 'football' ? 'Football' : 'Padel';

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
  sport: 'padel' | 'football',
  size = 14
): string {
  const src =
    sport === 'football' ? '/assets/football.svg' : '/assets/tennis.svg';
  return `<img src="${src}" width="${size}" height="${size}" alt="${sport}" style="display:block;" />`;
}
