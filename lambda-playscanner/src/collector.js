/**
 * Background Data Collector for AWS Lambda
 * Supports multiple providers (Playtomic, MATCHi, Padel Mates)
 */

const { PlaytomicProvider } = require('./providers/playtomic');
const { MatchiProvider } = require('./providers/matchi');
const { PadelMatesProvider } = require('./providers/padel-mates');
const { PowerLeagueProvider } = require('./providers/powerleague');
const { GoalsProvider } = require('./providers/goals');
const { FootyAddictsProvider } = require('./providers/footy-addicts');
const { FCUrbanProvider } = require('./providers/fc-urban');
const { HireAPitchProvider } = require('./providers/hireapitch');
const { FlowProvider } = require('./providers/flow');
const { setCachedData, logCollection } = require('./supabase');

class BackgroundCollector {
  constructor(options = {}) {
    // Register all available providers
    this.providers = [
      { name: 'playtomic', instance: new PlaytomicProvider() },
      { name: 'matchi', instance: new MatchiProvider() },
      { name: 'padel_mates', instance: new PadelMatesProvider() },
      { name: 'powerleague', instance: new PowerLeagueProvider() },
      { name: 'goals', instance: new GoalsProvider() },
      { name: 'footy_addicts', instance: new FootyAddictsProvider() },
      { name: 'fc_urban', instance: new FCUrbanProvider() },
      { name: 'hireapitch', instance: new HireAPitchProvider() },
      { name: 'flow', instance: new FlowProvider() },
    ];

    this.group = options.group || null;

    // Filter by single provider or provider group
    if (options.provider) {
      this.providers = this.providers.filter(
        (p) => p.name === options.provider
      );
    } else if (options.group === 'padel') {
      this.providers = this.providers.filter((p) =>
        ['playtomic', 'matchi', 'padel_mates', 'flow'].includes(p.name)
      );
    } else if (options.group === 'tennis') {
      // MATCHi has 0 London tennis venues — skip it
      this.providers = this.providers.filter((p) =>
        ['playtomic', 'flow'].includes(p.name)
      );
    } else if (options.group === 'football') {
      this.providers = this.providers.filter((p) =>
        [
          'powerleague',
          'goals',
          'footy_addicts',
          'fc_urban',
          'hireapitch',
          'flow',
        ].includes(p.name)
      );
    }
  }

  /**
   * Collect data for all configured cities, dates, and providers
   */
  async collectAll() {
    const startTime = Date.now();
    const results = [];
    const collectionId = `lambda_${Date.now()}`;

    // Clear per-invocation caches (prevents stale data across Lambda container reuse)
    for (const p of this.providers) {
      p.instance._facilitiesCache = undefined;
      p.instance._allSlots = undefined;
      p.instance._allGames = undefined;
      p.instance._polled = false;
    }

    // Configuration
    const cities = ['London'];
    const daysAhead = 7;

    console.log(
      `🤖 Starting collection ${collectionId} for ${cities.length} cities, ${daysAhead} days, ${this.providers.length} providers`
    );

    for (const city of cities) {
      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const dateString = date.toISOString().split('T')[0];

        // Collect from each provider for this city/date
        for (const provider of this.providers) {
          const itemStartTime = Date.now();

          try {
            const rawSlots = await Promise.race([
              this.collectCityDateProvider(city, dateString, provider),
              this.timeout(
                35000,
                `Timeout for ${provider.name} ${city} ${dateString}`
              ),
            ]);

            // Filter out past slots and short fragments (< 30 min)
            const now = Date.now();
            const slots = rawSlots.filter(
              (s) =>
                new Date(s.startTime).getTime() > now &&
                (s.duration || 60) >= 30
            );

            const executionTime = Date.now() - itemStartTime;
            const uniqueVenues = this.getUniqueVenues(slots);

            // Store in Supabase (read-merge-write per provider)
            await setCachedData(city, dateString, slots, provider.name);

            await logCollection({
              collection_id: collectionId,
              city,
              date: dateString,
              status: 'success',
              slots_collected: slots.length,
              venues_processed: uniqueVenues.length,
              execution_time_ms: executionTime,
              provider: provider.name,
            });

            results.push({
              city,
              date: dateString,
              provider: provider.name,
              status: 'success',
              slotsCount: slots.length,
              venuesCount: uniqueVenues.length,
              priceRange: this.getPriceRange(slots),
              executionTime,
            });

            console.log(
              `✅ ${provider.name} ${city} ${dateString}: ${slots.length} slots from ${uniqueVenues.length} venues (${executionTime}ms)`
            );

            // Adaptive delay between requests
            await this.sleep(1000 + Math.random() * 1000);
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
              provider: provider.name,
            });

            results.push({
              city,
              date: dateString,
              provider: provider.name,
              status: 'error',
              error: error.message,
              executionTime,
            });

            console.error(
              `❌ ${provider.name} ${city} ${dateString}: ${error.message} (${executionTime}ms)`
            );

            await this.sleep(2000);
          }
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
        totalVenues: this.getTotalVenueCount(results),
        collectionTime: totalTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Collect data for a specific city, date, and provider
   */
  async collectCityDateProvider(city, date, provider) {
    // Determine sport from group or provider name
    let sport = 'padel';
    if (this.group === 'tennis') {
      sport = 'tennis';
    } else if (this.group === 'football') {
      sport = 'football';
    } else if (!this.group) {
      // No group = running all providers, infer from provider name
      const footballProviders = [
        'powerleague',
        'goals',
        'footy_addicts',
        'fc_urban',
        'hireapitch',
      ];
      if (footballProviders.includes(provider.name)) sport = 'football';
    }

    const params = {
      sport,
      location: city,
      date,
    };

    const slots = await provider.instance.fetchAvailability(params);
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

  getTotalVenueCount(results) {
    return results.reduce((sum, r) => (r.venuesCount || 0) + sum, 0);
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
