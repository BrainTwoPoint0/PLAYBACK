/**
 * OpenActive Collector
 * Orchestrates feed crawling for London venues across 7 days.
 * Supports multiple providers: Bookteq and Better/GLL (football, basketball, tennis, padel).
 */

const { BookteqProvider } = require('./providers/bookteq');
const { BetterProvider } = require('./providers/better');
const { writeSlots, logCollection } = require('./supabase');
const { resolveSport } = require('./slot-mapper');
const venues = require('../venues');

class OpenActiveCollector {
  /**
   * @param {object} options
   * @param {string} [options.provider] - 'bookteq', 'better', or 'all' (default: 'all')
   */
  constructor(options = {}) {
    this.providerFilter = options.provider || 'all';
    this.providers = {};

    if (this.providerFilter === 'all' || this.providerFilter === 'bookteq') {
      const legendFeeds = venues.LEGEND_FEEDS || [];
      const allVenues = [...venues, ...legendFeeds];
      this.providers.bookteq = new BookteqProvider(allVenues);
    }

    if (this.providerFilter === 'all' || this.providerFilter === 'better') {
      this.providers.better = new BetterProvider();
    }
  }

  async collectAll() {
    const startTime = Date.now();
    const results = [];
    const collectionId = `openactive_${Date.now()}`;

    const cities = ['London'];
    const daysAhead = 7;
    const providerNames = Object.keys(this.providers);

    console.log(
      `🏟️ OpenActive collection ${collectionId}: providers=[${providerNames.join(', ')}], ${daysAhead} days`
    );

    for (const [providerName, provider] of Object.entries(this.providers)) {
      // Cache provider name for log labels
      const cacheProvider =
        providerName === 'bookteq' ? 'openactive' : providerName;

      for (const city of cities) {
        for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
          const date = new Date();
          date.setDate(date.getDate() + dayOffset);
          const dateString = date.toISOString().split('T')[0];
          const itemStartTime = Date.now();

          try {
            const timeoutMs = providerName === 'better' ? 120000 : 60000;
            const slots = await Promise.race([
              provider.fetchAvailability({ date: dateString }),
              this.timeout(
                timeoutMs,
                `Timeout for ${providerName} ${city} ${dateString}`
              ),
            ]);

            const executionTime = Date.now() - itemStartTime;
            const uniqueVenues = [...new Set(slots.map((s) => s.venue.id))];

            // Write to the flat playscanner_slots table. Unlike
            // lambda-playscanner, the openactive event payload doesn't carry
            // a sport — Better's RPDE feed can emit multiple sports in one
            // batch — so derive scope.sports from the batch itself.
            const batchSports = [
              ...new Set(slots.map((s) => resolveSport(s)).filter(Boolean)),
            ];
            if (batchSports.length > 0) {
              const wsResult = await writeSlots(slots, cacheProvider, {
                cities: [city],
                sports: batchSports,
                dates: [dateString],
              });
              console.log(
                `🗂️ ${cacheProvider} [${batchSports.join(',')}] ${city} ${dateString}: +${wsResult.written}/~${wsResult.tombstoned}`
              );
            }

            await logCollection({
              collection_id: collectionId,
              city,
              date: dateString,
              status: 'success',
              slots_collected: slots.length,
              venues_processed: uniqueVenues.length,
              execution_time_ms: executionTime,
              provider: cacheProvider,
            });

            results.push({
              city,
              date: dateString,
              provider: providerName,
              status: 'success',
              slotsCount: slots.length,
              venuesCount: uniqueVenues.length,
              executionTime,
            });

            console.log(
              `✅ ${cacheProvider} ${city} ${dateString}: ${slots.length} slots from ${uniqueVenues.length} venues (${executionTime}ms)`
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
              provider: cacheProvider,
            });

            results.push({
              city,
              date: dateString,
              provider: providerName,
              status: 'error',
              error: error.message,
              executionTime,
            });

            console.error(
              `❌ ${cacheProvider} ${city} ${dateString}: ${error.message} (${executionTime}ms)`
            );
          }
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
