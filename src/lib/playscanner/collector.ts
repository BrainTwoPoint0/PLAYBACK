import { PlaytomicProvider } from './providers/playtomic';
import { persistentCache } from './persistent-cache';
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
    const collectionId = `collection_${Date.now()}`;

    // Production-ready configuration (optimized for serverless)
    const cities = ['London']; // Add Manchester, Birmingham, etc. later
    const daysAhead = 3; // Collect 3 days ahead for faster execution

    console.log(
      `🤖 Starting background collection ${collectionId} for ${cities.length} cities, ${daysAhead} days`
    );

    for (const city of cities) {
      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const dateString = date.toISOString().split('T')[0];
        const itemStartTime = Date.now();

        try {
          // Add timeout for individual collection (reduced for serverless)
          const slots = await Promise.race([
            this.collectCityDate(city, dateString),
            this.timeout<CourtSlot[]>(
              8000,
              `Collection timeout for ${city} ${dateString}`
            ),
          ]);

          const executionTime = Date.now() - itemStartTime;
          const uniqueVenues = this.getUniqueVenues(slots);

          // Store in persistent cache
          await persistentCache.setCachedData(city, dateString, slots);

          // Store venue metadata
          const venues = [...new Set(slots.map((slot) => slot.venue))];
          for (const venue of venues) {
            try {
              await persistentCache.storeVenue(venue, city);
            } catch (venueError) {
              console.warn(`Failed to store venue ${venue.id}:`, venueError);
            }
          }

          // Log successful collection
          await persistentCache.logCollection({
            collection_id: collectionId,
            city,
            date: dateString,
            status: 'success',
            slots_collected: slots.length,
            venues_processed: uniqueVenues.length,
            execution_time_ms: executionTime,
            provider: 'playtomic',
          });

          results.push({
            city,
            date: dateString,
            status: 'success',
            slotsCount: slots.length,
            venuesCount: uniqueVenues.length,
            priceRange: this.getPriceRange(slots),
            collectedAt: new Date().toISOString(),
            executionTime,
            slots, // Store the actual slots for response
          });

          console.log(
            `✅ ${city} ${dateString}: ${slots.length} slots from ${uniqueVenues.length} venues (${executionTime}ms)`
          );

          // Adaptive delay based on success
          await this.sleep(1000 + Math.random() * 2000); // 1-3s random delay
        } catch (error) {
          const executionTime = Date.now() - itemStartTime;
          const errorMessage = (error as Error).message;

          // Log failed collection
          await persistentCache.logCollection({
            collection_id: collectionId,
            city,
            date: dateString,
            status: 'error',
            slots_collected: 0,
            venues_processed: 0,
            error_message: errorMessage,
            execution_time_ms: executionTime,
            provider: 'playtomic',
          });

          results.push({
            city,
            date: dateString,
            status: 'error',
            error: errorMessage,
            collectedAt: new Date().toISOString(),
            executionTime,
          });

          console.error(
            `❌ ${city} ${dateString}: ${errorMessage} (${executionTime}ms)`
          );

          // Longer delay after errors
          await this.sleep(3000);
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

  private timeout<T>(ms: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
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
  executionTime?: number;
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
