/**
 * AWS Lambda Handler for PLAYScanner Background Collection
 *
 * This Lambda function runs periodically to collect padel court availability
 * from Playtomic and stores the data in Supabase for fast cached access.
 */

const { BackgroundCollector } = require('./collector');

/**
 * Main Lambda handler function
 */
exports.handler = async (event, context) => {
  console.log('🚀 PLAYScanner Lambda Collection Started');
  console.log('Event:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    // Validate environment variables
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Create collector instance
    const collector = new BackgroundCollector();

    // Set Lambda-specific timeout (5 minutes max, leave 30s buffer)
    const lambdaTimeout = context.getRemainingTimeInMillis() - 30000;
    const collectionTimeout = Math.min(lambdaTimeout, 270000); // 4.5 minutes max

    console.log(
      `⏱️ Lambda timeout: ${lambdaTimeout}ms, Collection timeout: ${collectionTimeout}ms`
    );

    // Run collection with timeout
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

    // Prepare response
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: 'Background collection completed',
        collection: collectionResult,
        executionTime: totalTime,
        timestamp: new Date().toISOString(),
      }),
    };

    console.log(`✅ Collection completed successfully in ${totalTime}ms`);
    console.log(
      `📊 Summary: ${collectionResult.summary.successfulCollections}/${collectionResult.summary.totalCollections} successful`
    );
    console.log(
      `📊 Total slots: ${collectionResult.summary.totalSlots} from ${collectionResult.summary.totalVenues} venues`
    );

    return response;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ Collection failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: 'Background collection failed',
        error: error.message,
        executionTime: totalTime,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

/**
 * Health check handler (optional endpoint)
 */
exports.healthCheck = async (event) => {
  try {
    const { getCacheStats } = require('./supabase');
    const stats = await getCacheStats();

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'healthy',
        cacheStats: stats,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
