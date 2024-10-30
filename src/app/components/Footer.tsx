import localFont from 'next/font/local';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
const BrainTwoPoint0Regular = localFont({
  src: '../../../public/fonts/AvertaStd-Regular.ttf',
});
const BrainTwoPoint0Black = localFont({
  src: '../../../public/fonts/AvertaStd-Black.ttf',
});
const BrainTwoPoint0Semibold = localFont({
  src: '../../../public/fonts/AvertaStd-Semibold.ttf',
});
const BrainTwoPoint0Thin = localFont({
  src: '../../../public/fonts/AvertaStd-Thin.ttf',
});

export default function Footer() {
  return (
    <footer className="container mx-auto flex p-5 items-center justify-between border-t border-[var(--timberwolf)]">
      <div className="flex gap-4">
        <Link href="https://www.instagram.com/playback_global" target="_blank">
          <Image
            src="/assets/instagram.png"
            alt="PLAYBACK Instagram"
            height={50}
            width={50}
            className="h-9 w-9"
          />
        </Link>
        <Link href="https://youtube.com/@playback-sports-ai" target="_blank">
          <Image
            src="/assets/youtube.png"
            alt="PLAYBACK Instagram"
            height={50}
            width={50}
            className="h-9 w-9"
          />
        </Link>
        <Link href="https://www.tiktok.com/@playback_global" target="_blank">
          <Image
            src="/assets/tiktok.png"
            alt="PLAYBACK Instagram"
            height={50}
            width={50}
            className="h-9 w-9"
          />
        </Link>
        <Link
          href="https://www.linkedin.com/company/playbacksports/"
          target="_blank"
        >
          <Image
            src="/assets/linkedin.png"
            alt="PLAYBACK Instagram"
            height={50}
            width={50}
            className="h-9 w-9"
          />
        </Link>
      </div>
      <h2 className="text-lg">
        by{' '}
        <Link href="https://www.braintwopoint0.com">
          <span className={`${BrainTwoPoint0Semibold.className}`}>
            BRAIN
            <span className={`${BrainTwoPoint0Thin.className}`}>2.0</span>
          </span>
        </Link>
      </h2>
    </footer>
  );
}
