/**
 * Local test script for PLAYScanner Lambda function
 *
 * Usage: node test-local.js
 */

require('dotenv').config();

// Mock Lambda context
const mockContext = {
  functionName: 'playscanner-collector-test',
  functionVersion: '$LATEST',
  invokedFunctionArn:
    'arn:aws:lambda:eu-west-2:123456789:function:playscanner-collector-test',
  memoryLimitInMB: '512',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/playscanner-collector-test',
  logStreamName: '2025/01/25/[$LATEST]test',
  getRemainingTimeInMillis: () => 300000, // 5 minutes
};

// Mock event
const mockEvent = {
  source: 'aws.events',
  detail: {},
  time: new Date().toISOString(),
};

// Test the handler
async function testHandler() {
  console.log('🧪 Testing PLAYScanner Lambda Handler Locally');
  console.log('==========================================');

  try {
    // Check environment variables
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
    const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
      console.error(
        '❌ Missing environment variables:',
        missingVars.join(', ')
      );
      console.log('\nPlease create a .env file with:');
      console.log('SUPABASE_URL=your-supabase-url');
      console.log('SUPABASE_SERVICE_KEY=your-service-key');
      process.exit(1);
    }

    console.log('✅ Environment variables loaded');
    console.log(`📍 Supabase URL: ${process.env.SUPABASE_URL}`);

    // Import and run handler
    const { handler } = require('./src/index');

    console.log('\n🚀 Invoking handler...\n');
    const startTime = Date.now();

    const result = await handler(mockEvent, mockContext);

    const duration = Date.now() - startTime;

    console.log('\n📊 Handler Result:');
    console.log('==================');
    console.log(`Status Code: ${result.statusCode}`);
    console.log(`Duration: ${duration}ms`);

    const body = JSON.parse(result.body);
    console.log('\nResponse Body:');
    console.log(JSON.stringify(body, null, 2));

    if (result.statusCode === 200) {
      console.log('\n✅ Test completed successfully!');

      if (body.collection && body.collection.summary) {
        const summary = body.collection.summary;
        console.log('\n📈 Collection Summary:');
        console.log(`- Total Collections: ${summary.totalCollections}`);
        console.log(`- Successful: ${summary.successfulCollections}`);
        console.log(`- Total Slots: ${summary.totalSlots}`);
        console.log(`- Total Venues: ${summary.totalVenues}`);
        console.log(`- Collection Time: ${summary.collectionTime}ms`);
      }
    } else {
      console.log('\n❌ Test failed!');
      console.log('Error:', body.error);
    }
  } catch (error) {
    console.error('\n💥 Test error:', error);
    process.exit(1);
  }
}

// Test health check endpoint
async function testHealthCheck() {
  console.log('\n\n🏥 Testing Health Check Endpoint');
  console.log('================================');

  try {
    const { healthCheck } = require('./src/index');
    const result = await healthCheck({});

    console.log('Status Code:', result.statusCode);
    const body = JSON.parse(result.body);
    console.log('Health Status:', body.status);

    if (body.cacheStats) {
      console.log('\n📊 Cache Statistics:');
      console.log(`- Total Entries: ${body.cacheStats.totalEntries}`);
      console.log(`- Active Entries: ${body.cacheStats.activeEntries}`);
      console.log(`- Cities Covered: ${body.cacheStats.citiesCovered}`);
    }
  } catch (error) {
    console.error('Health check error:', error);
  }
}

// Run tests
async function runTests() {
  await testHandler();
  await testHealthCheck();
}

runTests().catch(console.error);
