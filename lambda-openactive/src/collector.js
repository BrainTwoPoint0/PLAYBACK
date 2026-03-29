/**
 * OpenActive Football Collector
 * Orchestrates feed crawling for London Bookteq venues across 7 days.
 */

const { BookteqProvider } = require('./providers/bookteq');
const { setCachedData, logCollection } = require('./supabase');
const venues = require('../venues');

class OpenActiveCollector {
  constructor() {
    // Combine Bookteq venues + Legend feeds into one provider
    const legendFeeds = venues.LEGEND_FEEDS || [];
    const allVenues = [...venues, ...legendFeeds];
    this.provider = new BookteqProvider(allVenues);
  }

  async collectAll() {
    const startTime = Date.now();
    const results = [];
    const collectionId = `openactive_${Date.now()}`;

    const cities = ['London'];
    const daysAhead = 7;

    console.log(
      `🏟️ OpenActive collection ${collectionId}: ${venues.length} venues, ${daysAhead} days`
    );

    for (const city of cities) {
      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const dateString = date.toISOString().split('T')[0];
        const itemStartTime = Date.now();

        try {
          const slots = await Promise.race([
            this.provider.fetchAvailability({ date: dateString }),
            this.timeout(60000, `Timeout for ${city} ${dateString}`),
          ]);

          const executionTime = Date.now() - itemStartTime;
          const uniqueVenues = [...new Set(slots.map((s) => s.venue.id))];

          // Write to shared cache
          await setCachedData(city, dateString, slots, 'openactive');

          await logCollection({
            collection_id: collectionId,
            city,
            date: dateString,
            status: 'success',
            slots_collected: slots.length,
            venues_processed: uniqueVenues.length,
            execution_time_ms: executionTime,
            provider: 'openactive',
          });

          results.push({
            city,
            date: dateString,
            status: 'success',
            slotsCount: slots.length,
            venuesCount: uniqueVenues.length,
            executionTime,
          });

          console.log(
            `✅ openactive ${city} ${dateString}: ${slots.length} slots from ${uniqueVenues.length} venues (${executionTime}ms)`
          );
        } catch (error) {
          const executionTime = Date.now() - itemStartTime;

          await logCollection({
            collection_id: collectionId,
            city,
            date: dateString,
            status: 'error',
            slots_collected: 0,
            venues_processed: 0,
            error_message: error.message,
            execution_time_ms: executionTime,
            provider: 'openactive',
          });

          results.push({
            city,
            date: dateString,
            status: 'error',
            error: error.message,
            executionTime,
          });

          console.error(
            `❌ openactive ${city} ${dateString}: ${error.message} (${executionTime}ms)`
          );
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.status === 'success').length;
    const totalSlots = results.reduce((sum, r) => (r.slotsCount || 0) + sum, 0);

    console.log(
      `🎯 OpenActive complete: ${successCount}/${results.length} successful, ${totalSlots} slots, ${totalTime}ms`
    );

    return {
      results,
      summary: {
        totalCollections: results.length,
        successfulCollections: successCount,
        totalSlots,
        collectionTime: totalTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  timeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }
}

module.exports = { OpenActiveCollector };
