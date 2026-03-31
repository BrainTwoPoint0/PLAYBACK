/**
 * AWS Lambda Handler for OpenActive Collection
 *
 * Crawls OpenActive RPDE feeds for London sports facility availability
 * and stores data in the shared PLAYScanner Supabase cache.
 *
 * Supports multiple providers via event.provider:
 *   - 'bookteq' (default) — football pitches from Bookteq/Legend venues
 *   - 'better' — basketball courts from Better/GLL leisure centres
 *   - 'all' — run both providers sequentially
 */

const { OpenActiveCollector } = require('./collector');

exports.handler = async (event, context) => {
  const provider = event?.provider || 'all';
  console.log(`🏟️ OpenActive Lambda Started (provider: ${provider})`);

  const startTime = Date.now();

  try {
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    const collector = new OpenActiveCollector({ provider });

    const lambdaTimeout = context.getRemainingTimeInMillis() - 30000;
    // Better feed is larger — allow more time when running it
    const defaultTimeout =
      provider === 'better' || provider === 'all' ? 540000 : 270000;
    const collectionTimeout = Math.min(lambdaTimeout, defaultTimeout);

    console.log(`⏱️ Collection timeout: ${collectionTimeout}ms`);

    const collectionResult = await Promise.race([
      collector.collectAll(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Collection timeout')),
          collectionTimeout
        )
      ),
    ]);

    const totalTime = Date.now() - startTime;

    console.log(`✅ Collection completed in ${totalTime}ms`);
    console.log(
      `📊 ${collectionResult.summary.successfulCollections}/${collectionResult.summary.totalCollections} successful, ${collectionResult.summary.totalSlots} slots`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        provider,
        collection: collectionResult,
        executionTime: totalTime,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ Collection failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        provider,
        error: error.message,
        executionTime: totalTime,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
