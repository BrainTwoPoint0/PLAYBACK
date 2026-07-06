// Football positions
export const FOOTBALL_POSITIONS = [
  'GK',
  'CB',
  'LB',
  'RB',
  'LWB',
  'RWB',
  'CDM',
  'CM',
  'CAM',
  'LM',
  'RM',
  'LW',
  'RW',
  'ST',
  'CF',
] as const;

export type FootballPosition = (typeof FOOTBALL_POSITIONS)[number];

// i18n key suffixes under `profileLabels.positions.*`. Display strings live in
// messages/partials/profile.json; translate via useProfileLabels() (or the
// per-map hooks) in src/lib/profile/use-profile-labels.ts.
export const FOOTBALL_POSITION_KEYS: Record<FootballPosition, string> = {
  GK: 'goalkeeper',
  CB: 'centreBack',
  LB: 'leftBack',
  RB: 'rightBack',
  LWB: 'leftWingBack',
  RWB: 'rightWingBack',
  CDM: 'defensiveMidfielder',
  CM: 'centralMidfielder',
  CAM: 'attackingMidfielder',
  LM: 'leftMidfielder',
  RM: 'rightMidfielder',
  LW: 'leftWinger',
  RW: 'rightWinger',
  ST: 'striker',
  CF: 'centreForward',
};

// Football experience levels (matches DB enum)
export const FOOTBALL_EXPERIENCE_LEVELS = [
  'recreational',
  'school_team',
  'sunday_league',
  'club_youth',
  'academy',
  'amateur_club',
  'non_league',
  'college_university',
  'semi_professional',
  'professional',
  'former_professional',
] as const;

export type FootballExperienceLevel =
  (typeof FOOTBALL_EXPERIENCE_LEVELS)[number];

// i18n key suffixes under `profileLabels.experience.*`.
export const FOOTBALL_EXPERIENCE_KEYS: Record<FootballExperienceLevel, string> =
  {
    recreational: 'recreational',
    school_team: 'schoolTeam',
    sunday_league: 'sundayLeague',
    club_youth: 'clubYouth',
    academy: 'academy',
    amateur_club: 'amateurClub',
    non_league: 'nonLeague',
    college_university: 'collegeUniversity',
    semi_professional: 'semiProfessional',
    professional: 'professional',
    former_professional: 'formerProfessional',
  };

// Preferred foot options
export const PREFERRED_FOOT_OPTIONS = ['left', 'right', 'both'] as const;
export type PreferredFoot = (typeof PREFERRED_FOOT_OPTIONS)[number];
