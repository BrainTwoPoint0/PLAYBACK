import {
  FOOTBALL_POSITIONS,
  FOOTBALL_EXPERIENCE_LEVELS,
  PREFERRED_FOOT_OPTIONS,
  type FootballPosition,
  type FootballExperienceLevel,
  type PreferredFoot,
} from './constants';

export interface CreatePlayerVariantInput {
  experience_level: string;
  preferred_foot: string;
  primary_position: string;
  secondary_positions?: string[];
  preferred_jersey_number?: number | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCreatePlayerVariant(
  input: CreatePlayerVariantInput
): ValidationResult {
  const errors: string[] = [];

  // Experience level
  if (!input.experience_level) {
    errors.push('Experience level is required');
  } else if (
    !FOOTBALL_EXPERIENCE_LEVELS.includes(
      input.experience_level as FootballExperienceLevel
    )
  ) {
    errors.push('Invalid experience level');
  }

  // Preferred foot
  if (!input.preferred_foot) {
    errors.push('Preferred foot is required');
  } else if (
    !PREFERRED_FOOT_OPTIONS.includes(input.preferred_foot as PreferredFoot)
  ) {
    errors.push('Invalid preferred foot');
  }

  // Primary position
  if (!input.primary_position) {
    errors.push('Primary position is required');
  } else if (
    !FOOTBALL_POSITIONS.includes(input.primary_position as FootballPosition)
  ) {
    errors.push('Invalid primary position');
  }

  // Secondary positions (optional)
  if (input.secondary_positions && input.secondary_positions.length > 0) {
    for (const pos of input.secondary_positions) {
      if (!FOOTBALL_POSITIONS.includes(pos as FootballPosition)) {
        errors.push(`Invalid secondary position: ${pos}`);
      }
    }
    // Secondary positions should not include primary
    if (input.secondary_positions.includes(input.primary_position)) {
      errors.push('Secondary positions should not include primary position');
    }
  }

  // Jersey number (optional)
  if (input.preferred_jersey_number != null) {
    const num = input.preferred_jersey_number;
    if (!Number.isInteger(num) || num < 1 || num > 99) {
      errors.push('Jersey number must be between 1 and 99');
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Update validation ---

export interface UpdateBaseProfileInput {
  full_name?: string | null;
  bio?: string | null;
  social_links?: Record<string, string> | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  date_of_birth?: string | null;
  location?: string | null;
  nationality?: string | null;
}

export function validateUpdateBaseProfile(
  input: UpdateBaseProfileInput
): ValidationResult {
  const errors: string[] = [];

  if (input.full_name !== undefined && input.full_name !== null) {
    if (input.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters');
    } else if (input.full_name.length > 100) {
      errors.push('Full name must be 100 characters or less');
    }
  }

  if (input.bio !== undefined && input.bio !== null && input.bio.length > 500) {
    errors.push('Bio must be 500 characters or less');
  }

  if (input.height_cm !== undefined && input.height_cm !== null) {
    if (input.height_cm < 100 || input.height_cm > 250) {
      errors.push('Height must be between 100 and 250 cm');
    }
  }

  if (input.weight_kg !== undefined && input.weight_kg !== null) {
    if (input.weight_kg < 30 || input.weight_kg > 200) {
      errors.push('Weight must be between 30 and 200 kg');
    }
  }

  if (input.date_of_birth !== undefined && input.date_of_birth !== null) {
    const date = new Date(input.date_of_birth);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date of birth');
    } else if (date > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Highlight validation ---

export interface CreateHighlightInput {
  title: string;
  video_url: string;
  thumbnail_url?: string | null;
  description?: string | null;
}

export function validateCreateHighlight(
  input: CreateHighlightInput
): ValidationResult {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (input.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }

  if (!input.video_url || input.video_url.trim().length === 0) {
    errors.push('Video URL is required');
  }

  if (
    input.description !== undefined &&
    input.description !== null &&
    input.description.length > 500
  ) {
    errors.push('Description must be 500 characters or less');
  }

  return { valid: errors.length === 0, errors };
}

export interface UpdateFootballProfileInput {
  experience_level?: string;
  preferred_foot?: string;
  primary_position?: string;
  secondary_positions?: string[];
  preferred_jersey_number?: number | null;
}

export function validateUpdateFootballProfile(
  input: UpdateFootballProfileInput
): ValidationResult {
  const errors: string[] = [];

  if (
    input.experience_level !== undefined &&
    !FOOTBALL_EXPERIENCE_LEVELS.includes(
      input.experience_level as FootballExperienceLevel
    )
  ) {
    errors.push('Invalid experience level');
  }

  if (
    input.preferred_foot !== undefined &&
    !PREFERRED_FOOT_OPTIONS.includes(input.preferred_foot as PreferredFoot)
  ) {
    errors.push('Invalid preferred foot');
  }

  if (
    input.primary_position !== undefined &&
    !FOOTBALL_POSITIONS.includes(input.primary_position as FootballPosition)
  ) {
    errors.push('Invalid primary position');
  }

  if (input.secondary_positions !== undefined) {
    for (const pos of input.secondary_positions) {
      if (!FOOTBALL_POSITIONS.includes(pos as FootballPosition)) {
        errors.push(`Invalid secondary position: ${pos}`);
      }
    }
    if (
      input.primary_position &&
      input.secondary_positions.includes(input.primary_position)
    ) {
      errors.push('Secondary positions should not include primary position');
    }
  }

  if (
    input.preferred_jersey_number !== undefined &&
    input.preferred_jersey_number !== null
  ) {
    const num = input.preferred_jersey_number;
    if (!Number.isInteger(num) || num < 1 || num > 99) {
      errors.push('Jersey number must be between 1 and 99');
    }
  }

  return { valid: errors.length === 0, errors };
}
