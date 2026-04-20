'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { getMarketingAssetUrl } from '@/lib/supabase/storage';

const trustLogos = [
  { name: 'Manchester City', src: '/network/manchester-city-badge.png' },
  { name: 'Junior Premier League', src: '/network/yfl.png' },
  { name: 'Soccer Elite FA', src: '/network/SEFA.png' },
  { name: 'GOALS', src: '/network/g-logo.png' },
  { name: 'DAFL', src: '/network/DAFL-logo.png' },
];

const stats = [
  { value: '75,000+', label: 'Players powered globally' },
  { value: '25+', label: 'Partners in 10+ countries' },
  { value: '£750k+', label: 'Saved for our partners' },
  { value: '12', label: 'Pro contracts signed' },
];

const GRAIN_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>";

export function Header() {
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // SSR + pre-mount always renders the "motion" variant so hydration matches.
  // After mount, honour the user's reduced-motion preference.
  const reducedMotion = mounted && Boolean(prefersReduced);
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section
      id="main"
      className="relative isolate overflow-hidden"
      style={{ marginTop: 'calc(var(--chrome-h, 112px) * -1)' }}
    >
      <HeroBackdrop reducedMotion={Boolean(reducedMotion)} />

      <div className="relative min-h-[clamp(640px,92vh,980px)] flex items-end">
        <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-10 pt-32 pb-20 md:pt-40 md:pb-24">
          <div className="max-w-[26ch] sm:max-w-[22ch]">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion ? { duration: 0 } : { duration: 0.6, ease }
              }
              className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-ink-muted"
            >
              <span aria-hidden className="h-px w-8 bg-line-strong" />
              You PLAY. We BACK.
            </motion.p>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.9, ease, delay: 0.08 }
            }
            className="mt-7 font-display font-semibold text-timberwolf text-[clamp(48px,7.8vw,104px)] leading-[0.95] tracking-[-0.045em] max-w-[22ch]"
          >
            The top 1%
            <br className="md:hidden" aria-hidden /> of tools.
            <br />
            <span className="text-ink-muted">
              For the 99%
              <br className="md:hidden" aria-hidden /> who play.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.8, ease, delay: 0.18 }
            }
            className="mt-7 max-w-[32ch] text-[19px] md:text-[24px] leading-[1.35] font-medium text-timberwolf tracking-[-0.015em]"
          >
            Every match filmed. Every stat tracked. Every player seen.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.8, ease, delay: 0.22 }
            }
            className="mt-4 max-w-[54ch] text-[15px] md:text-[17px] leading-[1.55] text-ink-muted [text-wrap:balance]"
          >
            PLAYBACK gives all players access to the same tech professionals use
            - across 25+ clubs in 10+ countries.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.8, ease, delay: 0.28 }
            }
            className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center"
          >
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-timberwolf text-night text-[15px] font-medium transition-colors hover:bg-ash-grey focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf focus-visible:ring-offset-2 focus-visible:ring-offset-night shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(0,0,0,0.35)]"
            >
              Create your profile
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 motion-reduce:transition-none group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/#contact"
              className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border border-[rgba(214,213,201,0.22)] bg-[rgba(10,16,13,0.35)] backdrop-blur-sm text-timberwolf text-[15px] transition-colors hover:bg-[rgba(10,16,13,0.55)] hover:border-timberwolf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf focus-visible:ring-offset-2 focus-visible:ring-offset-night"
            >
              For clubs - talk to us
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              reducedMotion ? { duration: 0 } : { duration: 0.9, delay: 0.4 }
            }
            className="mt-16 md:mt-20"
          >
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 md:gap-y-6 border-t border-[rgba(214,213,201,0.14)] pt-10">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-2">
                  <dd className="font-display font-semibold tabular-nums text-[clamp(32px,3.6vw,48px)] tracking-[-0.035em] text-timberwolf leading-[0.95]">
                    {s.value}
                  </dd>
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-ink-subtle leading-[1.3]">
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </div>

      <div className="relative">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10 py-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle mb-6">
            Powering the PLAYBACK Network
          </p>
          <ul className="flex flex-wrap items-center gap-x-10 gap-y-5">
            {trustLogos.map((logo) => (
              <li key={logo.name} className="flex items-center">
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={80}
                  height={40}
                  className="h-7 md:h-9 w-auto object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function HeroBackdrop({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 1.4, ease: [0.22, 1, 0.36, 1] }
        }
        className="absolute inset-0"
      >
        {reducedMotion ? (
          <Image
            src="/hero/hero-poster.jpg?v=5"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <video
            key="hero-v5"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/hero/hero-poster.jpg?v=5"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={(e) => {
              // If Supabase Storage 404s (e.g. preview env without migration),
              // hide the failing element and let the poster shine through.
              (e.currentTarget as HTMLVideoElement).style.display = 'none';
            }}
          >
            {/* Mobile variant - 480p, ~4.7MB vs 12MB desktop. Listed first so
                browsers pick the matching media source before falling through
                to the higher-bitrate desktop source. */}
            <source
              media="(max-width: 768px)"
              src={getMarketingAssetUrl('hero/hero.v5.mobile.mp4')}
              type="video/mp4"
            />
            <source
              src={getMarketingAssetUrl('hero/hero.v5.mp4')}
              type="video/mp4"
            />
          </video>
        )}
      </motion.div>

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,16,13,0.55) 0%, rgba(10,16,13,0.72) 35%, rgba(10,16,13,0.88) 70%, rgba(10,16,13,0.98) 100%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 30%, transparent 0%, rgba(10,16,13,0.35) 60%, rgba(10,16,13,0.85) 100%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("${GRAIN_SVG}")`,
          backgroundSize: '220px 220px',
        }}
      />

      <div
        className="absolute left-0 right-0 bottom-0 h-40"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, var(--surface-0) 100%)',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 45% at 22% 72%, rgba(214,213,201,0.08), transparent 70%)',
        }}
      />
    </div>
  );
}
