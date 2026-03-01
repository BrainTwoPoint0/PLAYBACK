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

export const FOOTBALL_POSITION_LABELS: Record<FootballPosition, string> = {
  GK: 'Goalkeeper',
  CB: 'Centre Back',
  LB: 'Left Back',
  RB: 'Right Back',
  LWB: 'Left Wing Back',
  RWB: 'Right Wing Back',
  CDM: 'Defensive Midfielder',
  CM: 'Central Midfielder',
  CAM: 'Attacking Midfielder',
  LM: 'Left Midfielder',
  RM: 'Right Midfielder',
  LW: 'Left Winger',
  RW: 'Right Winger',
  ST: 'Striker',
  CF: 'Centre Forward',
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

export const FOOTBALL_EXPERIENCE_LABELS: Record<
  FootballExperienceLevel,
  string
> = {
  recreational: 'Recreational',
  school_team: 'School Team',
  sunday_league: 'Sunday League',
  club_youth: 'Club Youth',
  academy: 'Academy',
  amateur_club: 'Amateur Club',
  non_league: 'Non-League',
  college_university: 'College / University',
  semi_professional: 'Semi-Professional',
  professional: 'Professional',
  former_professional: 'Former Professional',
};

// Preferred foot options
export const PREFERRED_FOOT_OPTIONS = ['left', 'right', 'both'] as const;
export type PreferredFoot = (typeof PREFERRED_FOOT_OPTIONS)[number];
