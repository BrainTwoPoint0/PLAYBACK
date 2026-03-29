/**
 * AWS Lambda Handler for OpenActive Football Collection
 *
 * Crawls Bookteq OpenActive RPDE feeds for London football pitch availability
 * and stores data in the shared PLAYScanner Supabase cache.
 */

const { OpenActiveCollector } = require('./collector');

exports.handler = async (event, context) => {
  console.log('🏟️ OpenActive Football Lambda Started');

  const startTime = Date.now();

  try {
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    const collector = new OpenActiveCollector();

    const lambdaTimeout = context.getRemainingTimeInMillis() - 30000;
    const collectionTimeout = Math.min(lambdaTimeout, 270000);

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
        error: error.message,
        executionTime: totalTime,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
