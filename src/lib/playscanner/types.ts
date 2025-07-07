// Core sport types
export type Sport = 'padel' | 'football';

// Provider types
export type PadelProvider = 'playtomic' | 'matchi' | 'padel_mates';
export type FootballProvider =
  | 'powerleague'
  | 'fc_urban'
  | 'footy_addicts'
  | 'fives';
export type Provider = PadelProvider | FootballProvider;

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

export interface CourtSlot {
  id: string;
  sport: Sport;
  provider: Provider;
  venue: Venue;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // minutes
  price: number; // pence
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
  sportMeta: PadelMeta | FootballMeta;
  lastUpdated: string; // ISO 8601
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

export interface SearchResultsProps {
  results: CourtSlot[];
  isLoading: boolean;
  sport: Sport;
  error?: PLAYScannerError;
}
