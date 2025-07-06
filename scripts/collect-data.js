#!/usr/bin/env node

/**
 * Background Data Collection Script (Playskan-style)
 * 
 * This script runs periodically to collect and cache availability data
 * Usage: node scripts/collect-data.js
 * Cron: 0 30 * * * * (every 30 minutes)
 */

const https = require('https');

// Configuration
const DOMAIN = process.env.VERCEL_URL || process.env.DOMAIN || 'playbacksports.ai';
const SECRET = process.env.PLAYSCANNER_COLLECT_SECRET;
const PROTOCOL = DOMAIN.includes('localhost') ? 'http' : 'https';

if (!SECRET) {
    console.error('❌ Missing PLAYSCANNER_COLLECT_SECRET environment variable');
    process.exit(1);
}

async function collectData() {
    const startTime = Date.now();
    console.log(`🤖 Starting background collection at ${new Date().toISOString()}`);

    const url = `${PROTOCOL}://${DOMAIN}/api/playscanner/collect`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SECRET}`,
                'Content-Type': 'application/json',
                'User-Agent': 'PlayScan-Collector/1.0',
            },
        });

        const data = await response.json();

        if (response.ok) {
            const { collection, cacheUpdates, totalTime } = data;
            const { summary } = collection;

            console.log(`✅ Collection successful:`);
            console.log(`   - ${summary.successfulCollections}/${summary.totalCollections} collections`);
            console.log(`   - ${summary.totalSlots} slots from ${summary.totalVenues} venues`);
            console.log(`   - ${cacheUpdates} cache updates`);
            console.log(`   - Collection time: ${summary.collectionTime}ms`);
            console.log(`   - Total time: ${totalTime}ms`);

            // Log any failures
            const failures = collection.results.filter(r => r.status === 'error');
            if (failures.length > 0) {
                console.log(`⚠️  ${failures.length} collection failures:`);
                failures.forEach(f => {
                    console.log(`   - ${f.city} ${f.date}: ${f.error}`);
                });
            }

        } else {
            console.error(`❌ Collection failed: ${response.status} ${response.statusText}`);
            console.error(`   Response:`, data);
            process.exit(1);
        }

    } catch (error) {
        console.error(`❌ Collection error:`, error.message);
        process.exit(1);
    }
}

// Run collection
collectData()
    .then(() => {
        console.log(`🎯 Collection completed at ${new Date().toISOString()}`);
        process.exit(0);
    })
    .catch(error => {
        console.error(`💥 Unexpected error:`, error);
        process.exit(1);
    }); 