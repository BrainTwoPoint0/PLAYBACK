import { PlaytomicProvider } from './providers/playtomic';
import { CourtSlot } from './types';

/**
 * Background Data Collector (Playskan-style)
 *
 * This service runs periodically to collect and cache availability data
 * Users get instant responses from cached data instead of live scraping
 */
export class BackgroundCollector {
  private provider: PlaytomicProvider;

  constructor() {
    this.provider = new PlaytomicProvider();
  }

  /**
   * Collect data for all configured cities and dates
   */
  async collectAll(): Promise<CollectionResult> {
    const startTime = Date.now();
    const results: CollectionItem[] = [];

    // Configuration - expand as needed
    const cities = ['London']; // Add Manchester, Birmingham, etc. later
    const daysAhead = 3; // Collect next 3 days (reduced from 7)

    console.log(
      `🤖 Starting background collection for ${cities.length} cities, ${daysAhead} days`
    );

    for (const city of cities) {
      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const dateString = date.toISOString().split('T')[0];

        try {
          const slots = await this.collectCityDate(city, dateString);

          results.push({
            city,
            date: dateString,
            status: 'success',
            slotsCount: slots.length,
            venuesCount: this.getUniqueVenues(slots).length,
            priceRange: this.getPriceRange(slots),
            collectedAt: new Date().toISOString(),
            slots, // Store the actual slots for caching
          });

          console.log(
            `✅ ${city} ${dateString}: ${slots.length} slots from ${this.getUniqueVenues(slots).length} venues`
          );

          // Respectful delay between collections (increased from 2s to 5s)
          await this.sleep(5000);
        } catch (error) {
          results.push({
            city,
            date: dateString,
            status: 'error',
            error: (error as Error).message,
            collectedAt: new Date().toISOString(),
          });

          console.error(
            `❌ ${city} ${dateString}: ${(error as Error).message}`
          );
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.status === 'success').length;
    const totalSlots = results.reduce((sum, r) => (r.slotsCount || 0) + sum, 0);

    console.log(
      `🎯 Collection complete: ${successCount}/${results.length} successful, ${totalSlots} total slots, ${totalTime}ms`
    );

    return {
      results,
      summary: {
        totalCollections: results.length,
        successfulCollections: successCount,
        totalSlots,
        totalVenues: this.getTotalUniqueVenues(results),
        collectionTime: totalTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Collect data for a specific city and date
   */
  private async collectCityDate(
    city: string,
    date: string
  ): Promise<CourtSlot[]> {
    const params = {
      sport: 'padel' as const,
      location: city,
      date,
    };

    // Use debug mode to avoid retry complexity during collection
    process.env.PLAYSCANNER_DEBUG = 'true';
    const slots = await this.provider.fetchAvailability(params);
    delete process.env.PLAYSCANNER_DEBUG;

    return slots;
  }

  /**
   * Helper methods
   */
  private getUniqueVenues(slots: CourtSlot[]): string[] {
    return [...new Set(slots.map((slot) => slot.venue.id))];
  }

  private getPriceRange(
    slots: CourtSlot[]
  ): { min: number; max: number } | null {
    if (slots.length === 0) return null;

    const prices = slots.map((s) => s.price / 100); // Convert pence to pounds
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  private getTotalUniqueVenues(results: CollectionItem[]): number {
    const allVenues = new Set<string>();
    results.forEach((result) => {
      if (result.slots) {
        result.slots.forEach((slot) => allVenues.add(slot.venue.id));
      }
    });
    return allVenues.size;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Types
 */
export interface CollectionItem {
  city: string;
  date: string;
  status: 'success' | 'error';
  slotsCount?: number;
  venuesCount?: number;
  priceRange?: { min: number; max: number } | null;
  error?: string;
  collectedAt: string;
  slots?: CourtSlot[]; // Store actual slot data
}

export interface CollectionResult {
  results: CollectionItem[];
  summary: {
    totalCollections: number;
    successfulCollections: number;
    totalSlots: number;
    totalVenues: number;
    collectionTime: number;
    timestamp: string;
  };
}
