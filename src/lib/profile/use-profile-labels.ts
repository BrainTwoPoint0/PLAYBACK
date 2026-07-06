import { useTranslations } from 'next-intl';
import {
  FOOTBALL_POSITIONS,
  FOOTBALL_POSITION_KEYS,
  FOOTBALL_EXPERIENCE_LEVELS,
  FOOTBALL_EXPERIENCE_KEYS,
  PREFERRED_FOOT_OPTIONS,
  type FootballPosition,
  type FootballExperienceLevel,
  type PreferredFoot,
} from './constants';

// Locale-aware replacement for the static FOOTBALL_*_LABELS maps that used to
// live in constants.ts. The English strings live in
// messages/partials/profile.json under `profileLabels.*`; constants.ts keeps
// the value → key-suffix maps. Deliberately NOT marked 'use client' so the
// hooks work in both client components and synchronous server components
// (next-intl implements useTranslations for RSC).

export function useFootballPositionLabels(): Record<FootballPosition, string> {
  const t = useTranslations('profileLabels.positions');
  return Object.fromEntries(
    FOOTBALL_POSITIONS.map((pos) => [pos, t(FOOTBALL_POSITION_KEYS[pos])])
  ) as Record<FootballPosition, string>;
}

export function useFootballExperienceLabels(): Record<
  FootballExperienceLevel,
  string
> {
  const t = useTranslations('profileLabels.experience');
  return Object.fromEntries(
    FOOTBALL_EXPERIENCE_LEVELS.map((level) => [
      level,
      t(FOOTBALL_EXPERIENCE_KEYS[level]),
    ])
  ) as Record<FootballExperienceLevel, string>;
}

export function usePreferredFootLabels(): Record<PreferredFoot, string> {
  const t = useTranslations('profileLabels.foot');
  return Object.fromEntries(
    PREFERRED_FOOT_OPTIONS.map((foot) => [foot, t(foot)])
  ) as Record<PreferredFoot, string>;
}

/** Convenience aggregate when a component needs more than one map. */
export function useProfileLabels(): {
  positions: Record<FootballPosition, string>;
  experience: Record<FootballExperienceLevel, string>;
  foot: Record<PreferredFoot, string>;
} {
  return {
    positions: useFootballPositionLabels(),
    experience: useFootballExperienceLabels(),
    foot: usePreferredFootLabels(),
  };
}
