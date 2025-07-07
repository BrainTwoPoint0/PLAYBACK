#!/usr/bin/env node

/**
 * Migration Script: In-Memory Cache → Persistent Cache
 * 
 * This script helps migrate existing PLAYScanner data from the old
 * in-memory cache system to the new Supabase-based persistent cache.
 * 
 * Usage:
 *   node scripts/migrate-to-persistent-cache.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

class CacheMigrationService {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase environment variables. Check .env.local');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  /**
   * Test Supabase connection and tables
   */
  async testConnection() {
    console.log('🔗 Testing Supabase connection...');
    
    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await this.supabase
        .from('playscanner_cache')
        .select('count')
        .limit(1);

      if (connectionError) {
        throw new Error(`Connection failed: ${connectionError.message}`);
      }

      console.log('✅ Supabase connection successful');

      // Test required tables exist
      const requiredTables = [
        'playscanner_cache',
        'playscanner_collection_log',
        'playscanner_venues',
        'playscanner_health'
      ];

      for (const table of requiredTables) {
        const { error } = await this.supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          throw new Error(`Table ${table} not found or accessible: ${error.message}`);
        }
      }

      console.log('✅ All required tables accessible');
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Create initial test data to verify the system works
   */
  async createTestData() {
    console.log('🧪 Creating test data...');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const testSlots = [
      {
        id: 'test_slot_1',
        sport: 'padel',
        provider: 'playtomic',
        venue: {
          id: 'test_venue_1',
          name: 'Test Padel Club',
          provider: 'playtomic',
          location: {
            address: '123 Test Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            coordinates: { lat: 51.5074, lng: -0.1278 },
          },
          amenities: ['parking', 'changing_rooms'],
          images: [],
          contact: { website: 'https://example.com' },
        },
        startTime: `${today}T14:00:00.000Z`,
        endTime: `${today}T15:30:00.000Z`,
        duration: 90,
        price: 4500, // £45.00 in pence
        currency: 'GBP',
        bookingUrl: 'https://playtomic.com/test-booking',
        availability: { spotsAvailable: 1, totalSpots: 1 },
        features: { indoor: true, lights: true, surface: 'turf' },
        sportMeta: { courtType: 'indoor', level: 'open', doubles: true },
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'test_slot_2',
        sport: 'padel',
        provider: 'playtomic',
        venue: {
          id: 'test_venue_2',
          name: 'Another Test Club',
          provider: 'playtomic',
          location: {
            address: '456 Test Road',
            city: 'London',
            postcode: 'SW1A 2BB',
            coordinates: { lat: 51.5174, lng: -0.1378 },
          },
          amenities: ['cafe', 'pro_shop'],
          images: [],
          contact: { website: 'https://example2.com' },
        },
        startTime: `${today}T16:00:00.000Z`,
        endTime: `${today}T17:30:00.000Z`,
        duration: 90,
        price: 3500, // £35.00 in pence
        currency: 'GBP',
        bookingUrl: 'https://playtomic.com/test-booking-2',
        availability: { spotsAvailable: 1, totalSpots: 1 },
        features: { indoor: false, lights: true, surface: 'concrete' },
        sportMeta: { courtType: 'outdoor', level: 'open', doubles: true },
        lastUpdated: new Date().toISOString(),
      },
    ];

    try {
      // Store test cache data
      for (const date of [today, tomorrow]) {
        const cacheKey = `london:${date}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

        const { error } = await this.supabase
          .from('playscanner_cache')
          .upsert({
            cache_key: cacheKey,
            city: 'london',
            date,
            slots: testSlots,
            metadata: {
              totalSlots: testSlots.length,
              uniqueVenues: 2,
              collectedAt: new Date().toISOString(),
              provider: 'playtomic',
            },
            expires_at: expiresAt.toISOString(),
          });

        if (error) {
          throw error;
        }

        console.log(`✅ Created test cache entry for ${date}`);
      }

      // Store test venues
      const uniqueVenues = [...new Set(testSlots.map(slot => slot.venue))];
      for (const venue of uniqueVenues) {
        const { error } = await this.supabase
          .from('playscanner_venues')
          .upsert({
            venue_id: venue.id,
            provider: venue.provider,
            city: 'london',
            venue_data: venue,
            is_active: true,
            last_seen: new Date().toISOString(),
          });

        if (error) {
          console.warn(`Warning: Failed to store venue ${venue.id}:`, error.message);
        } else {
          console.log(`✅ Created test venue: ${venue.name}`);
        }
      }

      // Create test collection log
      const { error: logError } = await this.supabase
        .from('playscanner_collection_log')
        .insert({
          collection_id: 'test_migration_001',
          city: 'london',
          date: today,
          status: 'success',
          slots_collected: testSlots.length,
          venues_processed: uniqueVenues.length,
          execution_time_ms: 1500,
          provider: 'playtomic',
        });

      if (logError) {
        console.warn('Warning: Failed to create collection log:', logError.message);
      } else {
        console.log('✅ Created test collection log');
      }

      console.log('🎉 Test data created successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to create test data:', error.message);
      return false;
    }
  }

  /**
   * Test the cache retrieval
   */
  async testCacheRetrieval() {
    console.log('🔍 Testing cache retrieval...');

    try {
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `london:${today}`;

      const { data, error } = await this.supabase
        .from('playscanner_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        throw error;
      }

      if (!data || !data.slots) {
        throw new Error('No cached data found');
      }

      console.log(`✅ Retrieved ${data.slots.length} slots from cache`);
      console.log(`   Cache key: ${data.cache_key}`);
      console.log(`   Created: ${data.created_at}`);
      console.log(`   Expires: ${data.expires_at}`);

      return true;
    } catch (error) {
      console.error('❌ Cache retrieval test failed:', error.message);
      return false;
    }
  }

  /**
   * Test the cache statistics function
   */
  async testCacheStats() {
    console.log('📊 Testing cache statistics...');

    try {
      const { data, error } = await this.supabase
        .rpc('get_cache_stats');

      if (error) {
        throw error;
      }

      console.log('✅ Cache statistics:');
      console.log(`   Total entries: ${data.total_entries}`);
      console.log(`   Active entries: ${data.active_entries}`);
      console.log(`   Total slots: ${data.total_slots}`);
      console.log(`   Cities covered: ${data.cities_covered}`);

      return true;
    } catch (error) {
      console.error('❌ Cache stats test failed:', error.message);
      return false;
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');

    try {
      // Remove test cache entries
      const { error: cacheError } = await this.supabase
        .from('playscanner_cache')
        .delete()
        .like('cache_key', 'london:%');

      if (cacheError) {
        console.warn('Warning: Failed to clean cache:', cacheError.message);
      }

      // Remove test venues
      const { error: venueError } = await this.supabase
        .from('playscanner_venues')
        .delete()
        .like('venue_id', 'test_%');

      if (venueError) {
        console.warn('Warning: Failed to clean venues:', venueError.message);
      }

      // Remove test collection logs
      const { error: logError } = await this.supabase
        .from('playscanner_collection_log')
        .delete()
        .like('collection_id', 'test_%');

      if (logError) {
        console.warn('Warning: Failed to clean logs:', logError.message);
      }

      console.log('✅ Test data cleaned up');
      return true;
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      return false;
    }
  }

  /**
   * Run full migration test
   */
  async runMigration() {
    console.log('🚀 Starting PLAYScanner cache migration...\n');

    const steps = [
      { name: 'Test Connection', fn: () => this.testConnection() },
      { name: 'Create Test Data', fn: () => this.createTestData() },
      { name: 'Test Cache Retrieval', fn: () => this.testCacheRetrieval() },
      { name: 'Test Cache Statistics', fn: () => this.testCacheStats() },
    ];

    let allPassed = true;

    for (const step of steps) {
      console.log(`\n📋 ${step.name}...`);
      const passed = await step.fn();
      if (!passed) {
        allPassed = false;
        break;
      }
    }

    if (allPassed) {
      console.log('\n🎉 Migration test completed successfully!');
      console.log('\n✅ Next steps:');
      console.log('   1. Deploy to production with PLAYSCANNER_USE_CACHED=true');
      console.log('   2. Set up your collection cron job');
      console.log('   3. Test the collection endpoint manually');
      console.log('   4. Monitor the cache performance');
      
      // Ask about cleanup
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('\n🗑️ Clean up test data? (y/N): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          await this.cleanupTestData();
        }
        rl.close();
      });
    } else {
      console.log('\n❌ Migration test failed. Please check the errors above.');
      process.exit(1);
    }
  }
}

// Run the migration
async function main() {
  try {
    const migrationService = new CacheMigrationService();
    await migrationService.runMigration();
  } catch (error) {
    console.error('💥 Migration script failed:', error.message);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = { CacheMigrationService };