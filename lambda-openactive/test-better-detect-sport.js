/**
 * Unit tests for BetterProvider.detectSport
 * Run: node test-better-detect-sport.js
 */

const assert = require('node:assert/strict');
const { BetterProvider } = require('./src/providers/better');

const provider = new BetterProvider();
let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  try {
    assert.equal(actual, expected);
    console.log(`  ok  ${label}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL ${label}`);
    console.log(`       expected: ${expected}`);
    console.log(`       actual:   ${actual}`);
    failed++;
  }
}

console.log('detectSport — table tennis exclusion');
check(
  'name "Table Tennis" is not tennis',
  provider.detectSport('Table Tennis', ''),
  null
);
check(
  'name "Clissold Leisure Centre - Table Tennis 60min" is not tennis',
  provider.detectSport('Clissold Leisure Centre - Table Tennis 60min', ''),
  null
);
check(
  'name "Table tennis (indoor)" is not tennis',
  provider.detectSport('Table tennis (indoor)', ''),
  null
);
check(
  'url path /table-tennis-60min/ is not tennis',
  provider.detectSport(
    '',
    'https://bookings.better.org.uk/location/clissold-leisure-centre/table-tennis-60min/2026-04-12/by-time'
  ),
  null
);
check(
  'url path /table_tennis/ is not tennis',
  provider.detectSport('', 'https://example.com/sports/table_tennis/court'),
  null
);

console.log('detectSport — real tennis still detected');
check(
  'name "Tennis" still matches tennis',
  provider.detectSport('Tennis', ''),
  'tennis'
);
check(
  'name "Islington Tennis Centre" still matches tennis',
  provider.detectSport('Islington Tennis Centre', ''),
  'tennis'
);
check(
  'url path /tennis-court-outdoor/ still matches tennis',
  provider.detectSport(
    '',
    'https://bookings.better.org.uk/location/islington/tennis-court-outdoor/2026-04-12'
  ),
  'tennis'
);

console.log('detectSport — other sports unaffected');
check(
  'name "Basketball" still matches basketball',
  provider.detectSport('Basketball', ''),
  'basketball'
);
check(
  'name "Padel" still matches padel',
  provider.detectSport('Padel', ''),
  'padel'
);
check(
  'name "Football 5-a-side" still matches football',
  provider.detectSport('Football 5-a-side', ''),
  'football'
);

console.log('');
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
