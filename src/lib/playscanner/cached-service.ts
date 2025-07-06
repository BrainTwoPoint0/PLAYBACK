import { CourtSlot, SearchParams, SearchResult } from './types';

/**
 * Cached Data Service (Playskan-style approach)
 * 
 * Instead of live scraping on each request, serve pre-collected cached data
 * This is how Playskan avoids production scraping issues
 */

// Simple in-memory cache (in production, this would be your database)
const cache = new Map<string, CourtSlot[]>();

export class CachedSearchService {
    /**
     * Search cached data instead of live scraping
     */
    static async search(params: SearchParams): Promise<SearchResult> {
        const startTime = Date.now();
        const cacheKey = `${params.location}-${params.date}`;

        // Get cached slots for this location/date
        const cachedSlots = cache.get(cacheKey) || [];

        // Apply filters to cached data
        let filteredSlots = cachedSlots;

        // Filter by time range
        if (params.startTime) {
            const startTimeFilter = new Date(`${params.date}T${params.startTime}`).getTime();
            filteredSlots = filteredSlots.filter(
                slot => new Date(slot.startTime).getTime() >= startTimeFilter
            );
        }

        if (params.endTime) {
            const endTimeFilter = new Date(`${params.date}T${params.endTime}`).getTime();
            filteredSlots = filteredSlots.filter(
                slot => new Date(slot.endTime).getTime() <= endTimeFilter
            );
        }

        // Filter by price
        if (params.maxPrice) {
            filteredSlots = filteredSlots.filter(slot => slot.price <= params.maxPrice!);
        }

        // Filter by indoor/outdoor
        if (params.indoor !== undefined) {
            filteredSlots = filteredSlots.filter(slot => slot.features.indoor === params.indoor);
        }

        // Sort by time, then price
        filteredSlots.sort((a, b) => {
            const timeCompare = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            if (timeCompare !== 0) return timeCompare;
            return a.price - b.price;
        });

        return {
            results: filteredSlots,
            totalResults: filteredSlots.length,
            searchTime: Date.now() - startTime,
            providers: filteredSlots.length > 0 ? ['playtomic'] : [],
            filters: params,
            source: 'cached', // Indicate this is cached data
            cacheAge: this.getCacheAge(cacheKey),
        };
    }

    /**
     * Store collected data in cache
     */
    static setCachedData(location: string, date: string, slots: CourtSlot[]): void {
        const cacheKey = `${location}-${date}`;
        cache.set(cacheKey, slots);
    }

    /**
     * Get cache statistics
     */
    static getCacheStats() {
        return {
            totalKeys: cache.size,
            totalSlots: Array.from(cache.values()).reduce((sum, slots) => sum + slots.length, 0),
            cacheKeys: Array.from(cache.keys()),
        };
    }

    /**
     * Clear cache
     */
    static clearCache(): void {
        cache.clear();
    }

    /**
     * Get cache age for a specific key
     */
    private static getCacheAge(cacheKey: string): string {
        // In a real implementation, you'd track when data was last updated
        return 'recent';
    }

    /**
     * Simulate some cached data for testing
     */
    static initializeMockData(): void {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Mock data for London today
        const mockSlots: CourtSlot[] = [
            {
                id: 'mock_slot_1',
                sport: 'padel',
                provider: 'playtomic',
                venue: {
                    id: 'mock_venue_1',
                    name: 'Mock Padel Club',
                    provider: 'playtomic',
                    location: {
                        address: '123 Mock Street',
                        city: 'London',
                        postcode: 'SW1A 1AA',
                        coordinates: { lat: 51.5074, lng: -0.1278 },
                    },
                    amenities: [],
                    images: [],
                    contact: { website: 'https://example.com' },
                },
                startTime: `${today}T14:00:00.000Z`,
                endTime: `${today}T15:30:00.000Z`,
                duration: 90,
                price: 4500, // £45.00 in pence
                currency: 'GBP',
                bookingUrl: 'https://playtomic.com/book',
                availability: { spotsAvailable: 1, totalSpots: 1 },
                features: { indoor: true, lights: true, surface: 'turf' },
                sportMeta: { courtType: 'indoor', level: 'open', doubles: true },
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'mock_slot_2',
                sport: 'padel',
                provider: 'playtomic',
                venue: {
                    id: 'mock_venue_2',
                    name: 'Another Mock Club',
                    provider: 'playtomic',
                    location: {
                        address: '456 Mock Road',
                        city: 'London',
                        postcode: 'SW1A 2BB',
                        coordinates: { lat: 51.5174, lng: -0.1378 },
                    },
                    amenities: [],
                    images: [],
                    contact: { website: 'https://example2.com' },
                },
                startTime: `${today}T16:00:00.000Z`,
                endTime: `${today}T17:00:00.000Z`,
                duration: 60,
                price: 3500, // £35.00 in pence
                currency: 'GBP',
                bookingUrl: 'https://playtomic.com/book2',
                availability: { spotsAvailable: 1, totalSpots: 1 },
                features: { indoor: false, lights: true, surface: 'concrete' },
                sportMeta: { courtType: 'outdoor', level: 'open', doubles: true },
                lastUpdated: new Date().toISOString(),
            },
        ];

        this.setCachedData('London', today, mockSlots);
        this.setCachedData('London', tomorrow, mockSlots); // Same data for tomorrow
    }
} 