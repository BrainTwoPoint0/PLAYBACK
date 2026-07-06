'use client';

import * as React from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { usePathname } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'motion/react';
import { ArrowUpRight, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@braintwopoint0/playback-commons/auth';
import { cn } from '@/lib/utils';

type NavItemConfig = {
  key: string;
  href: string;
  match?: string;
  external?: boolean;
  badge?: 'live' | 'new';
};

type NavItem = NavItemConfig & {
  label: string;
  description: string;
};

const NAV_ITEM_CONFIG: NavItemConfig[] = [
  { key: 'forClubs', href: '/#audiences', match: '/#audiences' },
  { key: 'academy', href: '/academy', match: '/academy' },
  { key: 'tournaments', href: '/tournament', match: '/tournament' },
  {
    key: 'bookToPlay',
    href: '/playscanner',
    match: '/playscanner',
    badge: 'live',
  },
  { key: 'playhub', href: 'https://playhub.playbacksports.ai', external: true },
  { key: 'news', href: '/press', match: '/press' },
];

function useNavItems(): NavItem[] {
  const t = useTranslations('nav');
  return React.useMemo(
    () =>
      NAV_ITEM_CONFIG.map((config) => ({
        ...config,
        label: t(`items.${config.key}.label`),
        description: t(`items.${config.key}.description`),
      })),
    [t]
  );
}

const ANNOUNCE_KEY = 'pb_announce_playerdata_2026';
const ANNOUNCE_HREF = '/press/playback-x-playerdata';

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function useIsActive() {
  const pathname = usePathname();
  return React.useCallback(
    (item: NavItem) => {
      const match = item.match ?? item.href;
      if (match.startsWith('http')) return false;
      if (match.startsWith('/#')) return false;
      if (match === '/') return pathname === '/';
      return pathname === match || pathname.startsWith(match + '/');
    },
    [pathname]
  );
}

function Logo({ className }: { className?: string }) {
  const t = useTranslations('nav');
  return (
    <Link
      href="/"
      aria-label={t('logoAriaLabel')}
      className={cn(
        'inline-flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night',
        className
      )}
    >
      <Image
        src="/branding/PLAYBACK-Text.png"
        alt="PLAYBACK"
        width={240}
        height={48}
        priority
        quality={95}
        sizes="(min-width: 768px) 140px, 120px"
        className="h-6 md:h-7 w-auto select-none"
      />
    </Link>
  );
}

function HoverPanel({ description }: { description: string }) {
  return (
    <div
      role="tooltip"
      className={cn(
        'absolute left-1/2 top-[calc(100%+10px)] z-10 -translate-x-1/2 translate-y-1 opacity-0 pointer-events-none',
        'group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100',
        'transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hidden md:block'
      )}
    >
      <span
        aria-hidden
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 h-2 w-2 rotate-45 bg-surface-1 border-l border-t border-[rgba(214,213,201,0.12)]"
      />
      <div className="rounded-lg bg-[rgba(15,21,18,0.95)] backdrop-blur-xl border border-[rgba(214,213,201,0.12)] px-3.5 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_12px_32px_rgba(0,0,0,0.55)] whitespace-nowrap">
        <p className="text-[12px] leading-[1.4] text-ink-muted">
          {description}
        </p>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const base = cn(
    'relative inline-flex items-center gap-1.5 text-[13px] font-medium tracking-[-0.005em] transition-colors duration-200 py-1',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night rounded-sm',
    active
      ? 'text-timberwolf'
      : 'text-[rgba(214,213,201,0.6)] hover:text-timberwolf'
  );

  const content = (
    <>
      {item.label}
      {item.external ? (
        <ArrowUpRight
          className="h-3 w-3 opacity-70 rtl:-scale-x-100"
          aria-hidden
        />
      ) : null}
      {item.badge === 'live' ? (
        <span aria-hidden className="relative ms-1 inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[rgb(224,173,98)] opacity-60 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[rgb(224,173,98)]" />
        </span>
      ) : null}
      {active ? (
        <motion.span
          layoutId="nav-indicator"
          aria-hidden
          className="absolute -bottom-[7px] left-0 right-0 h-[2px] bg-timberwolf rounded-full"
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        />
      ) : null}
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        onClick={onNavigate}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={base} onClick={onNavigate}>
      {content}
    </Link>
  );
}

function AuthActions({
  variant,
  onNavigate,
}: {
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
}) {
  const t = useTranslations('nav');
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  if (loading) {
    return <div aria-hidden className="h-9 w-40" />;
  }

  const isMobile = variant === 'mobile';

  if (!user) {
    return (
      <div
        className={cn(
          'flex items-center',
          isMobile ? 'flex-col w-full gap-3' : 'flex-row gap-3'
        )}
      >
        <Link
          href="/auth/login"
          onClick={onNavigate}
          className={cn(
            'inline-flex items-center justify-center text-[13px] font-medium tracking-[-0.005em] text-[rgba(214,213,201,0.72)] hover:text-timberwolf transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night',
            isMobile ? 'w-full h-11' : 'h-9 px-2'
          )}
        >
          {t('signIn')}
        </Link>
        <Link
          href="/auth/register"
          onClick={onNavigate}
          className={cn(
            'group inline-flex items-center justify-center gap-1.5 rounded-full bg-timberwolf text-night text-[13px] font-semibold tracking-[-0.005em]',
            'transition-[background-color,transform] duration-200 hover:bg-ash-grey active:scale-[0.98]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(0,0,0,0.35)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf/80 focus-visible:ring-offset-2 focus-visible:ring-offset-night',
            isMobile ? 'w-full h-12 px-5 text-[14px]' : 'h-9 px-4'
          )}
        >
          {t('getStarted')}
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 motion-reduce:transition-none group-hover:translate-x-0.5 rtl:rotate-180"
          >
            →
          </span>
        </Link>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col w-full gap-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex items-center justify-center rounded-full h-12 px-5 text-[14px] font-semibold bg-timberwolf text-night w-full shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(0,0,0,0.35)]"
        >
          {t('dashboard')}
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            signOut();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full h-11 px-5 text-[14px] text-[rgba(214,213,201,0.72)] border border-line-strong hover:text-timberwolf w-full"
        >
          <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          {t('signOut')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center" ref={menuRef}>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={t('accountMenu')}
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-[rgba(214,213,201,0.2)] text-[rgba(214,213,201,0.72)] hover:text-timberwolf hover:border-timberwolf/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night transition-colors"
        >
          <UserRound className="h-3.5 w-3.5" aria-hidden />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute end-0 mt-2 w-48 rounded-xl border border-line bg-[rgba(15,21,18,0.95)] backdrop-blur-xl py-1 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_16px_40px_rgba(0,0,0,0.55)]"
            >
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-[rgba(214,213,201,0.72)] hover:text-timberwolf hover:bg-surface-2 rounded-md mx-1"
              >
                {t('dashboard')}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[rgba(214,213,201,0.72)] hover:text-timberwolf hover:bg-surface-2 rounded-md mx-1 text-start"
              >
                <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
                {t('signOut')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const MOBILE_GROUP_CONFIG: { key: string; itemKeys: string[] }[] = [
  { key: 'solutions', itemKeys: ['forClubs', 'academy', 'tournaments'] },
  { key: 'platform', itemKeys: ['bookToPlay', 'playhub', 'news'] },
];

const TRUST_STAT_KEYS = ['players', 'clubs', 'countries'] as const;

function MobileRow({
  item,
  active,
  onClose,
}: {
  item: NavItem;
  active: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('nav');
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'group/row relative flex items-center justify-between gap-4 py-4 border-b border-[rgba(214,213,201,0.06)]',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night rounded-sm',
        'transition-colors'
      )}
    >
      <span className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'text-[22px] font-medium tracking-[-0.02em] leading-[1.1] transition-colors',
              active
                ? 'text-timberwolf'
                : 'text-[rgba(214,213,201,0.82)] group-hover/row:text-timberwolf group-focus-visible/row:text-timberwolf'
            )}
          >
            {item.label}
          </span>
          {item.badge === 'live' ? (
            <>
              <span
                aria-hidden
                className="relative inline-flex h-1.5 w-1.5 ms-0.5"
              >
                <span className="absolute inline-flex h-full w-full rounded-full bg-[rgb(224,173,98)] opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[rgb(224,173,98)] shadow-[0_0_6px_rgba(224,173,98,0.55)]" />
              </span>
              <span className="sr-only">{t('liveNow')}</span>
            </>
          ) : null}
        </span>
        {item.description ? (
          <span className="text-[12.5px] leading-[1.4] text-[rgba(214,213,201,0.48)] font-normal tracking-[-0.005em]">
            {item.description}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={cn(
          'flex-shrink-0 text-[13px] leading-none text-[rgba(214,213,201,0.35)]',
          'opacity-0 -translate-x-1 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]',
          'group-hover/row:opacity-80 group-hover/row:translate-x-0',
          'group-focus-visible/row:opacity-80 group-focus-visible/row:translate-x-0',
          active && 'opacity-80 translate-x-0'
        )}
      >
        {item.external ? (
          <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
        ) : (
          <span className="inline-block rtl:rotate-180">→</span>
        )}
      </span>
    </Link>
  );
}

function MobileTakeover({
  open,
  onClose,
  isActive,
  scrolled,
}: {
  open: boolean;
  onClose: () => void;
  isActive: (item: NavItem) => boolean;
  scrolled: boolean;
}) {
  const t = useTranslations('nav');
  const navItems = useNavItems();
  const reducedMotion = useReducedMotion();
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => dialogRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  const itemInitial = reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 };
  const itemAnimate = reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="takeover-root"
          ref={dialogRef}
          tabIndex={-1}
          style={{ top: 'calc(var(--chrome-h, 112px) - 72px)' }}
          className="fixed inset-x-0 bottom-0 z-[60] md:hidden bg-night flex flex-col overflow-hidden isolate focus:outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={t('mainMenuLabel')}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(70% 50% at 50% 6%, rgba(185,186,163,0.07), transparent 65%)',
            }}
          />

          <div
            className={cn(
              'relative flex-shrink-0 flex items-center justify-between px-6 transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
              scrolled ? 'h-14' : 'h-[72px]'
            )}
          >
            <Logo />
            <button
              type="button"
              aria-label={t('closeMenu')}
              onClick={onClose}
              className="inline-flex items-center justify-center h-10 w-10 -me-2 rounded-full text-[rgba(214,213,201,0.72)] hover:text-timberwolf focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night transition-colors"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div
            aria-hidden
            className="relative flex-shrink-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(214,213,201,0.05) 18%, rgba(214,213,201,0.18) 50%, rgba(214,213,201,0.05) 82%, transparent 100%)',
            }}
          />

          <nav
            aria-label={t('primaryMobileNavLabel')}
            className="relative flex-1 px-6 pt-4 pb-6 overflow-y-auto"
          >
            {MOBILE_GROUP_CONFIG.map((group, groupIdx) => {
              const groupLabel = t(`groups.${group.key}`);
              return (
                <motion.section
                  key={group.key}
                  aria-label={groupLabel}
                  initial={itemInitial}
                  animate={itemAnimate}
                  transition={{
                    duration: reducedMotion ? 0 : 0.35,
                    delay: reducedMotion ? 0 : 0.05 + groupIdx * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={cn(groupIdx > 0 && 'mt-6')}
                >
                  <h2 className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[rgba(214,213,201,0.42)] mb-1 px-0.5">
                    {groupLabel}
                  </h2>
                  <ul className="flex flex-col">
                    {navItems
                      .filter((item) => group.itemKeys.includes(item.key))
                      .map((item) => (
                        <li key={item.key}>
                          <MobileRow
                            item={item}
                            active={isActive(item)}
                            onClose={onClose}
                          />
                        </li>
                      ))}
                  </ul>
                </motion.section>
              );
            })}

            <motion.div
              initial={itemInitial}
              animate={itemAnimate}
              transition={{
                duration: reducedMotion ? 0 : 0.35,
                delay: reducedMotion ? 0 : 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-7 pt-6 border-t border-[rgba(214,213,201,0.06)]"
            >
              <dl className="grid grid-cols-3">
                {TRUST_STAT_KEYS.map((key, i) => (
                  <div
                    key={key}
                    className={cn(
                      'flex flex-col items-start',
                      i > 0 && 'ps-4 border-s border-[rgba(214,213,201,0.08)]',
                      i < TRUST_STAT_KEYS.length - 1 && 'pe-4'
                    )}
                  >
                    <dd className="text-[20px] font-semibold text-timberwolf tabular-nums tracking-[-0.015em] leading-none">
                      {t(`stats.${key}.value`)}
                    </dd>
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-[rgba(214,213,201,0.5)] mt-2">
                      {t(`stats.${key}.label`)}
                    </dt>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[11px] text-[rgba(214,213,201,0.4)] tracking-[-0.005em]">
                {t('trustedBy')}
              </p>
            </motion.div>
          </nav>

          <div
            aria-hidden
            className="relative flex-shrink-0 h-px bg-[rgba(214,213,201,0.08)]"
          />

          <motion.div
            initial={itemInitial}
            animate={itemAnimate}
            transition={{
              duration: reducedMotion ? 0 : 0.35,
              delay: reducedMotion ? 0 : 0.26,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex-shrink-0 px-6 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]"
          >
            <AuthActions variant="mobile" onNavigate={onClose} />
            <p className="mt-5 text-center text-[10px] uppercase tracking-[0.3em] text-[rgba(214,213,201,0.3)]">
              {t('tagline')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AnnouncementBar() {
  const t = useTranslations('nav');
  const [mounted, setMounted] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ANNOUNCE_KEY);
      if (stored === 'dismissed') {
        setDismissed(true);
      }
    } catch {
      // localStorage unavailable - keep visible
    }
    setMounted(true);
    // No cleanup on unmount - the --chrome-h state belongs to the app shell,
    // not this component. Unsetting it on route change would leave wrong values.
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty(
      '--chrome-h',
      dismissed ? '72px' : '112px'
    );
  }, [mounted, dismissed]);

  const onDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(ANNOUNCE_KEY, 'dismissed');
    } catch {
      // ignore
    }
  };

  // SSR renders the bar visible so the initial paint matches --chrome-h: 112px
  // from globals.css (no CLS). After mount, if the user previously dismissed it,
  // the bar hides and the chrome-h effect drops to 72px in one paint.
  if (mounted && dismissed) return null;

  return (
    <div
      role="region"
      aria-label={t('announcement.regionLabel')}
      className="sticky top-0 z-[70] overflow-hidden isolate"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[rgba(11,17,14,0.96)] backdrop-blur-xl"
      />

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-80"
        style={{
          background:
            'radial-gradient(55% 140% at 22% 50%, rgba(185,186,163,0.08), transparent 70%), radial-gradient(45% 140% at 78% 50%, rgba(214,213,201,0.05), transparent 70%)',
        }}
      />

      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(214,213,201,0.06) 20%, rgba(214,213,201,0.26) 50%, rgba(214,213,201,0.06) 80%, transparent 100%)',
        }}
      />

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-[rgba(214,213,201,0.08)]"
      />

      <div className="relative mx-auto max-w-[1400px] flex items-center justify-between gap-2 px-4 sm:px-10 h-10">
        <Link
          href={ANNOUNCE_HREF}
          className="group/announce flex items-center gap-2 md:gap-3 min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night"
        >
          <span
            aria-hidden
            className="relative inline-flex h-1.5 w-1.5 flex-shrink-0"
          >
            <span className="absolute inline-flex h-full w-full rounded-full bg-[rgb(224,173,98)] opacity-60 animate-ping motion-reduce:animate-none" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[rgb(224,173,98)] shadow-[0_0_8px_rgba(224,173,98,0.65)]" />
          </span>

          <span className="hidden md:inline text-[10px] uppercase tracking-[0.22em] font-semibold text-timberwolf flex-shrink-0">
            {t('announcement.eyebrow')}
          </span>

          <span
            aria-hidden
            className="hidden md:inline-block h-3 w-px bg-[rgba(214,213,201,0.22)] flex-shrink-0"
          />

          <span className="min-w-0 flex items-baseline gap-1.5 text-[12px] md:text-[12.5px] leading-none text-[rgba(214,213,201,0.78)] group-hover/announce:text-timberwolf transition-colors">
            <span className="font-semibold text-timberwolf truncate tracking-[-0.005em]">
              {t('announcement.title')}
            </span>
            <span
              aria-hidden
              className="hidden sm:inline text-[rgba(214,213,201,0.35)] flex-shrink-0"
            >
              -
            </span>
            <span className="hidden sm:inline truncate tracking-[-0.005em]">
              {t('announcement.description')}
            </span>
          </span>

          <span
            aria-hidden
            className="hidden sm:inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-medium text-timberwolf flex-shrink-0 opacity-0 -translate-x-1 group-hover/announce:opacity-100 group-hover/announce:translate-x-0 transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            {t('announcement.readCta')}
            <span className="inline-block transition-transform duration-250 group-hover/announce:translate-x-0.5 rtl:rotate-180">
              →
            </span>
          </span>
        </Link>

        <button
          type="button"
          aria-label={t('announcement.dismiss')}
          onClick={onDismiss}
          className="flex-shrink-0 inline-flex items-center justify-center h-11 w-11 -me-2 rounded-full text-[rgba(214,213,201,0.45)] hover:text-timberwolf hover:bg-[rgba(214,213,201,0.08)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf/60"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default function NavBar() {
  const t = useTranslations('nav');
  const navItems = useNavItems();
  const scrolled = useScrolled(8);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isActive = useIsActive();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[70] focus:rounded-md focus:bg-timberwolf focus:text-night focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium"
      >
        {t('skipToContent')}
      </a>

      <AnnouncementBar />

      <header
        style={{ top: 'calc(var(--chrome-h, 112px) - 72px)' }}
        className={cn(
          'sticky z-50 transition-[background-color,backdrop-filter,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          scrolled
            ? 'bg-[rgba(10,16,13,0.68)] backdrop-blur-xl border-b border-[rgba(214,213,201,0.08)]'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div
          className={cn(
            'relative mx-auto max-w-[1400px] flex items-center justify-between px-6 sm:px-10 transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
            scrolled ? 'h-14' : 'h-[72px]'
          )}
        >
          <div className="flex items-center gap-10">
            <Logo />
            <nav aria-label={t('primaryNavLabel')} className="hidden md:block">
              <LayoutGroup id="primary-nav">
                <ul className="flex items-center gap-6">
                  {navItems.map((item) => (
                    <li key={item.key} className="group relative">
                      <NavLink item={item} active={isActive(item)} />
                      {item.description && !item.external ? (
                        <HoverPanel description={item.description} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </LayoutGroup>
            </nav>
          </div>
          <div className="hidden md:flex items-center gap-5">
            <LanguageSwitcher />
            <AuthActions variant="desktop" />
          </div>
          {/* Mobile: switcher lives in the top bar (not the drawer) so
              language is reachable without opening the menu. */}
          <div className="md:hidden flex items-center gap-1">
            <LanguageSwitcher className="px-2 py-2" />
            <button
              type="button"
              aria-label={t('openMenu')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center h-10 w-10 -me-2 rounded-full text-[rgba(214,213,201,0.72)] hover:text-timberwolf focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <MobileTakeover
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isActive={isActive}
        scrolled={scrolled}
      />
    </>
  );
}
