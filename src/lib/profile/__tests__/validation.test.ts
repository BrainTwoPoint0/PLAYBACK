import { describe, it, expect } from 'vitest';
import {
  validateCreatePlayerVariant,
  validateUpdateBaseProfile,
  validateUpdateFootballProfile,
  validateCreateHighlight,
  type CreatePlayerVariantInput,
} from '../validation';

const validInput: CreatePlayerVariantInput = {
  experience_level: 'academy',
  preferred_foot: 'right',
  primary_position: 'CM',
  secondary_positions: ['CAM', 'CDM'],
  preferred_jersey_number: 8,
};

describe('validateCreatePlayerVariant', () => {
  it('accepts valid input', () => {
    const result = validateCreatePlayerVariant(validInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts valid input without optional fields', () => {
    const result = validateCreatePlayerVariant({
      experience_level: 'recreational',
      preferred_foot: 'left',
      primary_position: 'GK',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Experience level validation
  it('rejects missing experience level', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      experience_level: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Experience level is required');
  });

  it('rejects invalid experience level', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      experience_level: 'world_class',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid experience level');
  });

  // Preferred foot validation
  it('rejects missing preferred foot', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      preferred_foot: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Preferred foot is required');
  });

  it('rejects invalid preferred foot', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      preferred_foot: 'ambidextrous',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid preferred foot');
  });

  // Primary position validation
  it('rejects missing primary position', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      primary_position: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Primary position is required');
  });

  it('rejects invalid primary position', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      primary_position: 'SWEEPER',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid primary position');
  });

  // Secondary positions validation
  it('rejects invalid secondary position', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      secondary_positions: ['CM', 'INVALID'],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid secondary position: INVALID');
  });

  it('rejects secondary position that matches primary', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      primary_position: 'CM',
      secondary_positions: ['CM', 'CAM'],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Secondary positions should not include primary position'
    );
  });

  it('accepts empty secondary positions array', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      secondary_positions: [],
    });
    expect(result.valid).toBe(true);
  });

  // Jersey number validation
  it('rejects jersey number below 1', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      preferred_jersey_number: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Jersey number must be between 1 and 99');
  });

  it('rejects jersey number above 99', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      preferred_jersey_number: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Jersey number must be between 1 and 99');
  });

  it('rejects non-integer jersey number', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      preferred_jersey_number: 7.5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Jersey number must be between 1 and 99');
  });

  it('accepts null jersey number', () => {
    const result = validateCreatePlayerVariant({
      ...validInput,
      preferred_jersey_number: null,
    });
    expect(result.valid).toBe(true);
  });

  // Multiple errors
  it('returns multiple errors when multiple fields are invalid', () => {
    const result = validateCreatePlayerVariant({
      experience_level: '',
      preferred_foot: '',
      primary_position: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('validateUpdateBaseProfile', () => {
  it('accepts empty update (no fields)', () => {
    const result = validateUpdateBaseProfile({});
    expect(result.valid).toBe(true);
  });

  it('accepts valid bio', () => {
    const result = validateUpdateBaseProfile({ bio: 'I play football' });
    expect(result.valid).toBe(true);
  });

  it('rejects bio over 500 characters', () => {
    const result = validateUpdateBaseProfile({ bio: 'x'.repeat(501) });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Bio must be 500 characters or less');
  });

  it('accepts null bio (clearing)', () => {
    const result = validateUpdateBaseProfile({ bio: null });
    expect(result.valid).toBe(true);
  });

  it('rejects height below 100', () => {
    const result = validateUpdateBaseProfile({ height_cm: 50 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Height must be between 100 and 250 cm');
  });

  it('rejects height above 250', () => {
    const result = validateUpdateBaseProfile({ height_cm: 300 });
    expect(result.valid).toBe(false);
  });

  it('accepts valid height', () => {
    const result = validateUpdateBaseProfile({ height_cm: 180 });
    expect(result.valid).toBe(true);
  });

  it('rejects weight below 30', () => {
    const result = validateUpdateBaseProfile({ weight_kg: 10 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Weight must be between 30 and 200 kg');
  });

  it('accepts valid weight', () => {
    const result = validateUpdateBaseProfile({ weight_kg: 75 });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid date of birth', () => {
    const result = validateUpdateBaseProfile({ date_of_birth: 'not-a-date' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid date of birth');
  });

  it('rejects future date of birth', () => {
    const result = validateUpdateBaseProfile({ date_of_birth: '2099-01-01' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Date of birth cannot be in the future');
  });

  it('accepts valid date of birth', () => {
    const result = validateUpdateBaseProfile({ date_of_birth: '2000-05-15' });
    expect(result.valid).toBe(true);
  });
});

describe('validateUpdateFootballProfile', () => {
  it('accepts empty update', () => {
    const result = validateUpdateFootballProfile({});
    expect(result.valid).toBe(true);
  });

  it('rejects invalid experience level', () => {
    const result = validateUpdateFootballProfile({
      experience_level: 'world_class',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid experience level');
  });

  it('accepts valid experience level', () => {
    const result = validateUpdateFootballProfile({
      experience_level: 'semi_professional',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid preferred foot', () => {
    const result = validateUpdateFootballProfile({
      preferred_foot: 'neither',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid primary position', () => {
    const result = validateUpdateFootballProfile({
      primary_position: 'SWEEPER',
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid position update', () => {
    const result = validateUpdateFootballProfile({
      primary_position: 'ST',
      secondary_positions: ['CF', 'LW'],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects jersey number out of range', () => {
    const result = validateUpdateFootballProfile({
      preferred_jersey_number: 100,
    });
    expect(result.valid).toBe(false);
  });
});

describe('validateCreateHighlight', () => {
  it('accepts valid input', () => {
    const result = validateCreateHighlight({
      title: 'My Goal',
      video_url: 'https://storage.example.com/video.mp4',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts valid input with optional fields', () => {
    const result = validateCreateHighlight({
      title: 'My Goal',
      video_url: 'https://storage.example.com/video.mp4',
      thumbnail_url: 'https://storage.example.com/thumb.jpg',
      description: 'A great goal from the final',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects missing title', () => {
    const result = validateCreateHighlight({
      title: '',
      video_url: 'https://storage.example.com/video.mp4',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  it('rejects title over 100 characters', () => {
    const result = validateCreateHighlight({
      title: 'x'.repeat(101),
      video_url: 'https://storage.example.com/video.mp4',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title must be 100 characters or less');
  });

  it('rejects missing video URL', () => {
    const result = validateCreateHighlight({
      title: 'My Goal',
      video_url: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Video URL is required');
  });

  it('rejects description over 500 characters', () => {
    const result = validateCreateHighlight({
      title: 'My Goal',
      video_url: 'https://storage.example.com/video.mp4',
      description: 'x'.repeat(501),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Description must be 500 characters or less'
    );
  });

  it('accepts null description', () => {
    const result = validateCreateHighlight({
      title: 'My Goal',
      video_url: 'https://storage.example.com/video.mp4',
      description: null,
    });
    expect(result.valid).toBe(true);
  });
});
