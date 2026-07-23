/**
 * Tests for the selector-drift detector and its wiring into the scrapers.
 * Run: node test-parse-drift.js
 */
const assert = require('assert');
const { warnSelectorDrift, MIN_HTML_BYTES } = require('./src/parse-drift');
const { FootyAddictsProvider } = require('./src/providers/footy-addicts');

function captureWarns(fn) {
  const warns = [];
  const orig = console.warn;
  console.warn = (...args) => warns.push(args.join(' '));
  try {
    fn();
  } finally {
    console.warn = orig;
  }
  return warns;
}

const bigHtml = '<html>' + 'x'.repeat(MIN_HTML_BYTES) + '</html>';

// 1. Warns on 0 matches in substantial HTML
let warns = captureWarns(() => {
  const fired = warnSelectorDrift('test_provider', 'anchor .foo', bigHtml, 0);
  assert.strictEqual(fired, true);
});
assert.strictEqual(warns.length, 1);
assert.ok(warns[0].includes('SELECTOR DRIFT'));
assert.ok(warns[0].includes('test_provider'));
assert.ok(warns[0].includes('anchor .foo'));

// 2. Silent when the anchor matches
warns = captureWarns(() => {
  assert.strictEqual(warnSelectorDrift('p', 'a', bigHtml, 3), false);
});
assert.strictEqual(warns.length, 0);

// 3. Silent on tiny/empty bodies (fetch problem, not selector drift)
warns = captureWarns(() => {
  assert.strictEqual(warnSelectorDrift('p', 'a', '<html></html>', 0), false);
  assert.strictEqual(warnSelectorDrift('p', 'a', '', 0), false);
  assert.strictEqual(warnSelectorDrift('p', 'a', null, 0), false);
});
assert.strictEqual(warns.length, 0);

// 4. Footy Addicts wiring: a large page with NO date labels (the 2026-07-22
// incident shape) fires the drift warning and parses 0 games.
const card =
  '<a class="group block" href="/football-games/123-test-venue-london">' +
  '<p class="truncate">Test Venue</p><span>18:00</span>' +
  '<div class="text-lg font-medium">£10</div><span>5v5</span></a>';
const noLabelsPage =
  '<html><body><div>' +
  card +
  '</div>' +
  'x'.repeat(MIN_HTML_BYTES) +
  '</body></html>';
warns = captureWarns(() => {
  const games = new FootyAddictsProvider().parseListingPage(noLabelsPage);
  assert.strictEqual(games.length, 0);
});
assert.strictEqual(
  warns.filter((w) => w.includes('SELECTOR DRIFT')).length,
  1,
  'expected exactly the date-label drift warning (cards are present)'
);
assert.ok(warns[0].includes('date labels'));

// 5. Footy Addicts wiring: a well-formed page (label + future-dated card)
// parses games and stays silent.
const tomorrow = new Date(Date.now() + 86400000);
const label =
  '<div class="mb-2 rounded-md bg-blue-800 uppercase tracking-wider">Tomorrow</div>';
const goodPage =
  '<html><body><div>' +
  label +
  '<div>' +
  card +
  '</div></div>' +
  'x'.repeat(MIN_HTML_BYTES) +
  '</body></html>';
warns = captureWarns(() => {
  const games = new FootyAddictsProvider().parseListingPage(goodPage);
  assert.strictEqual(games.length, 1);
  assert.strictEqual(games[0].venue.name, 'Test Venue');
  assert.strictEqual(
    games[0].startTime.split('T')[0],
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(
      tomorrow
    )
  );
});
assert.strictEqual(warns.filter((w) => w.includes('SELECTOR DRIFT')).length, 0);

console.log('✅ test-parse-drift: all assertions passed');
