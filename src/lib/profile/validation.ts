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

/**
 * Validate a single social_links value as a safe public URL. Mirrors the
 * defenses in the cover-image validator (HTTPS, no userinfo, no fragment,
 * length cap). Without this, an authenticated user could persist
 * arbitrary content (newline-injection into OG tags, javascript: URLs,
 * Basic-auth-smuggled URLs) into a field that's rendered in metadata.
 */
function isSafeSocialUrl(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > 500) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (parsed.username !== '' || parsed.password !== '') return false;
  // Reject control characters and embedded newlines that would corrupt OG
  // tags, link headers, or any future server-rendered HTML context.
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(value)) return false;
  return true;
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
      // eslint-disable-next-line no-control-regex
    } else if (/[\x00-\x1f\x7f]/.test(input.full_name)) {
      errors.push('Full name contains invalid characters');
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

  if (input.location !== undefined && input.location !== null) {
    if (input.location.length > 200) {
      errors.push('Location must be 200 characters or less');
      // eslint-disable-next-line no-control-regex
    } else if (/[\x00-\x1f\x7f]/.test(input.location)) {
      errors.push('Location contains invalid characters');
    }
  }

  if (input.nationality !== undefined && input.nationality !== null) {
    if (input.nationality.length > 100) {
      errors.push('Nationality must be 100 characters or less');
    }
  }

  if (input.social_links !== undefined && input.social_links !== null) {
    if (
      typeof input.social_links !== 'object' ||
      Array.isArray(input.social_links)
    ) {
      errors.push('Social links must be an object');
    } else {
      const entries = Object.entries(input.social_links);
      if (entries.length > 10) {
        errors.push('Up to 10 social links allowed');
      }
      for (const [key, value] of entries) {
        if (typeof key !== 'string' || !/^[a-z0-9_-]{1,30}$/i.test(key)) {
          errors.push(
            `Social link key "${key}" must be alphanumeric (≤30 chars)`
          );
          continue;
        }
        if (typeof value !== 'string' || value === '') {
          errors.push(`Social link "${key}" must be a non-empty string`);
          continue;
        }
        if (!isSafeSocialUrl(value)) {
          errors.push(`Social link "${key}" must be an https URL (≤500 chars)`);
        }
      }
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
