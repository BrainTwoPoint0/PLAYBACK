require('dotenv').config();

const { OpenActiveCollector } = require('./src/collector');

(async () => {
  console.log('Testing OpenActive Football Collection...\n');

  const collector = new OpenActiveCollector();
  const result = await collector.collectAll();

  console.log('\n=== Summary ===');
  console.log(JSON.stringify(result.summary, null, 2));
})();
