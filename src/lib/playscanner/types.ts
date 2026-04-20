// Core sport types
export type Sport = 'padel' | 'football' | 'tennis' | 'basketball';

// Provider display config with brand colors
export const PROVIDER_CONFIG: Record<
  string,
  { displayName: string; color: string }
> = {
  playtomic: { displayName: 'Playtomic', color: '#CCFF00' },
  matchi: { displayName: 'MATCHi', color: '#22AD5C' },
  padel_mates: { displayName: 'Padel Mates', color: '#41E79E' },
  powerleague: { displayName: 'PowerLeague', color: '#00A339' },
  goals: { displayName: 'Goals', color: '#FFD200' },
  openactive: { displayName: 'OpenActive', color: '#046BD2' },
  fc_urban: { displayName: 'FC Urban', color: '#F97316' },
  footy_addicts: { displayName: 'Footy Addicts', color: '#EF4444' },
  fives: { displayName: 'Fives', color: '#8B5CF6' },
  hireapitch: { displayName: 'HireAPitch', color: '#10B981' },
  flow: { displayName: 'Royal Parks', color: '#34D399' },
  clubspark: { displayName: 'ClubSpark (LTA)', color: '#0052A5' },
};

// Provider types
export type PadelProvider = 'playtomic' | 'matchi' | 'padel_mates' | 'flow';
export type TennisProvider = 'playtomic' | 'matchi' | 'flow' | 'clubspark';
export type FootballProvider =
  | 'openactive'
  | 'powerleague'
  | 'goals'
  | 'fc_urban'
  | 'footy_addicts'
  | 'fives'
  | 'hireapitch'
  | 'flow';
export type BasketballProvider = 'openactive';
export type Provider =
  | PadelProvider
  | TennisProvider
  | FootballProvider
  | BasketballProvider;

// Search parameters
export interface SearchParams {
  sport: Sport;
  location: string;
  date: string;
  startTime?: string;
  endTime?: string;
  maxPrice?: number;
  indoor?: boolean;
  filters?: SportSpecificFilters;
}

// Sport-specific filters
export interface SportSpecificFilters {
  padel?: PadelFilters;
  football?: FootballFilters;
}

export interface PadelFilters {
  level: 'beginner' | 'intermediate' | 'advanced' | 'open';
  courtType: 'indoor' | 'outdoor' | 'panoramic';
}

export interface FootballFilters {
  format: '5v5' | '6v6' | '7v7' | '8v8' | '11v11';
  organized: boolean;
  level: 'casual' | 'competitive' | 'mixed';
}

// Venue and court data
export interface Venue {
  id: string;
  name: string;
  provider: Provider;
  location: {
    address: string;
    city: string;
    postcode: string;
    coordinates: { lat: number; lng: number };
  };
  // Alternative address structure for compatibility
  address?: {
    city: string;
    postcode?: string;
    street?: string;
  };
  amenities: string[];
  images: string[];
  rating?: number;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  _raw?: any; // Provider-specific raw data
}

export type ListingType = 'pitch_hire' | 'drop_in';

export interface DurationOption {
  duration: number; // minutes
  price: number; // pence
}

export interface CourtSlot {
  id: string;
  sport: Sport;
  provider: Provider;
  listingType?: ListingType;
  venue: Venue;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // minutes (default/shortest option)
  price: number; // pence (default/shortest option)
  durationOptions?: DurationOption[]; // available booking durations + prices
  currency: 'GBP' | 'EUR';
  bookingUrl: string;
  availability: {
    spotsAvailable: number;
    totalSpots: number;
  };
  features: {
    indoor: boolean;
    lights: boolean;
    surface?: 'turf' | 'concrete' | 'grass' | 'astro' | 'other';
  };
  courtName?: string; // e.g. "Court 1", "5-a-side - Pitch 8"
  sportMeta: PadelMeta | FootballMeta | TennisMeta | BasketballMeta;
  lastUpdated: string; // ISO 8601
  collectedAt?: string; // ISO 8601 - when the provider data was fetched
}

// Sport-specific metadata
export interface PadelMeta {
  courtType: 'indoor' | 'outdoor' | 'panoramic';
  level: 'beginner' | 'intermediate' | 'advanced' | 'open';
  doubles: boolean;
}

export interface FootballMeta {
  format: '5v5' | '6v6' | '7v7' | '8v8' | '11v11';
  organized: boolean;
  level: 'casual' | 'competitive' | 'mixed';
  requiresTeam: boolean;
}

export interface TennisMeta {
  courtType: 'indoor' | 'outdoor' | 'covered';
  surface: 'hard' | 'clay' | 'grass' | 'artificial';
  format: 'singles' | 'doubles';
}

export interface BasketballMeta {
  format: '3v3' | '5v5';
  level: 'casual' | 'competitive' | 'mixed';
}

// Search results
export interface SearchResult {
  results: CourtSlot[];
  totalResults: number;
  searchTime: number; // milliseconds
  providers: Provider[];
  filters: SearchParams;
  source?: 'live' | 'cached' | 'persistent_cache'; // Indicates if data is live scraped or cached
  cacheAge?: string; // Age of cached data
}

// Booking types
export interface BookingParams {
  slotId: string;
  userEmail: string;
  playerCount: number;
  notes?: string;
}

export interface BookingResult {
  bookingId: string;
  redirectUrl: string;
  status: 'pending' | 'confirmed' | 'failed';
  expiresAt: string; // ISO 8601
}

export interface BookingStatus {
  bookingId: string;
  providerBookingId?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  slot: CourtSlot;
  userEmail: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Error types
export interface PLAYScannerError {
  code: string;
  message: string;
  provider?: Provider;
  details?: Record<string, any>;
}

// Component props
export interface SportSelectorProps {
  selectedSport: Sport;
  onSportChange: (sport: Sport) => void;
}

export interface SearchFormProps {
  sport: Sport;
  onSearch: (params: SearchParams) => void;
  isSearching: boolean;
}

// Sorting types
export type SortBy = 'time-asc' | 'time-desc' | 'price-asc' | 'price-desc';

export interface SearchResultsProps {
  results: CourtSlot[];
  isLoading: boolean;
  sport: Sport;
  error?: PLAYScannerError;
  onConversion?: (slot: CourtSlot) => void;
}
