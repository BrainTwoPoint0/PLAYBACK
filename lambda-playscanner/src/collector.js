/**
 * Background Data Collector for AWS Lambda
 * Simplified version optimized for Lambda execution
 */

const { PlaytomicProvider } = require('./providers/playtomic');
const { setCachedData, storeVenue, logCollection } = require('./supabase');

class BackgroundCollector {
  constructor() {
    this.provider = new PlaytomicProvider();
  }

  /**
   * Collect data for all configured cities and dates
   */
  async collectAll() {
    const startTime = Date.now();
    const results = [];
    const collectionId = `lambda_${Date.now()}`;

    // Configuration
    const cities = ['London']; // Start with London, expand later
    const daysAhead = 7; // Collect 7 days ahead

    console.log(
      `🤖 Starting collection ${collectionId} for ${cities.length} cities, ${daysAhead} days`
    );

    for (const city of cities) {
      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const dateString = date.toISOString().split('T')[0];
        const itemStartTime = Date.now();

        try {
          // Collect with timeout
          const slots = await Promise.race([
            this.collectCityDate(city, dateString),
            this.timeout(35000, `Timeout for ${city} ${dateString}`), // Increased to 35 seconds
          ]);

          const executionTime = Date.now() - itemStartTime;
          const uniqueVenues = this.getUniqueVenues(slots);

          // Store in Supabase
          await setCachedData(city, dateString, slots);

          // Store venue metadata - disabled to avoid schema cache issues
          // Venue data is already stored within each slot, so this is redundant
          // const venues = [...new Set(slots.map((slot) => slot.venue))];
          // for (const venue of venues) {
          //   try {
          //     await storeVenue(venue, city);
          //   } catch (venueError) {
          //     console.warn(`Failed to store venue ${venue.id}:`, venueError.message);
          //   }
          // }

          // Log successful collection
          await logCollection({
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
            executionTime,
          });

          console.log(
            `✅ ${city} ${dateString}: ${slots.length} slots from ${uniqueVenues.length} venues (${executionTime}ms)`
          );

          // Adaptive delay
          await this.sleep(1000 + Math.random() * 1000);
        } catch (error) {
          const executionTime = Date.now() - itemStartTime;

          // Log failed collection
          await logCollection({
            collection_id: collectionId,
            city,
            date: dateString,
            status: 'error',
            slots_collected: 0,
            venues_processed: 0,
            error_message: error.message,
            execution_time_ms: executionTime,
            provider: 'playtomic',
          });

          results.push({
            city,
            date: dateString,
            status: 'error',
            error: error.message,
            executionTime,
          });

          console.error(
            `❌ ${city} ${dateString}: ${error.message} (${executionTime}ms)`
          );

          // Longer delay after errors
          await this.sleep(2000);
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
  async collectCityDate(city, date) {
    const params = {
      sport: 'padel',
      location: city,
      date,
    };

    const slots = await this.provider.fetchAvailability(params);
    return slots;
  }

  /**
   * Helper methods
   */
  getUniqueVenues(slots) {
    return [...new Set(slots.map((slot) => slot.venue.id))];
  }

  getPriceRange(slots) {
    if (slots.length === 0) return null;

    const prices = slots.map((s) => s.price / 100);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  getTotalUniqueVenues(results) {
    const allVenues = new Set();
    results.forEach((result) => {
      if (result.slotsCount > 0) {
        // We don't have the actual slots here, so use venuesCount
        // This is an approximation
        allVenues.add(`${result.city}_${result.venuesCount}`);
      }
    });
    return allVenues.size;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  timeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }
}

module.exports = { BackgroundCollector };
