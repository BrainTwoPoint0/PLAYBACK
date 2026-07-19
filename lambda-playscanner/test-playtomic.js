/**
 * Unit tests for the Playtomic provider (src/providers/playtomic.js)
 * Run: node test-playtomic.js
 *
 * Playtomic walled off the public api.playtomic.io behind an AWS WAF and
 * retired /venues/{city}. The provider now scrapes the same-origin
 * playtomic.com BFF:
 *   - discovery: the /padel-courts/{city} landing page embeds a flat tenant
 *     object per club in its RSC payload (escaped quotes)
 *   - availability: /api/clubs/availability?tenant_id&date&sport_id returns
 *     [{ resource_id, start_date, slots:[{ start_time, duration, price }] }]
 *
 * These tests exercise the two pure parsing seams against captured fixtures,
 * so a shape change on Playtomic's side fails here (and in CI) rather than
 * silently producing zero slots.
 */

const assert = require('node:assert/strict');
const { PlaytomicProvider } = require('./src/providers/playtomic');

let passed = 0;
let failed = 0;

// Checks are queued (not run inline) so both sync and async assertions can be
// awaited in order before the summary is printed.
const queue = [];
function check(label, fn) {
  queue.push(async () => {
    try {
      await fn();
      console.log(`  ok  ${label}`);
      passed++;
    } catch (err) {
      console.log(`  FAIL ${label}`);
      console.log(`       ${err.message}`);
      failed++;
    }
  });
}

// ---------------------------------------------------------------------------
// Discovery: parseVenues over an RSC-escaped city-page fixture.
// The \" escaping mirrors how Next.js serializes the payload into the HTML.
// ---------------------------------------------------------------------------
const cityPageFixture =
  'window.__next_f.push([1,"...' +
  '{\\"id\\":\\"4ab18f91-d6bb-440e-b890-4d5422a786fc\\",\\"slug\\":\\"the-hive-london\\",\\"name\\":\\"The Hive London \\",\\"country_code\\":\\"GB\\",\\"address\\":\\"Camrose Avenue, Edgware, HA8 6AG\\",\\"image\\":\\"https://res.cloudinary.com/playtomic/x.jpg\\"}' +
  '...more...' +
  '{\\"id\\":\\"05274e61-c2b9-41f1-bb50-4fbf40661a99\\",\\"slug\\":\\"rocks-lane-barnes-london\\",\\"name\\":\\"Rocks Lane Barnes\\",\\"country_code\\":\\"GB\\",\\"address\\":\\"Rocks Lane, Barnes, SW13 0DG\\",\\"image\\":\\"https://res.cloudinary.com/playtomic/y.jpg\\"}' +
  '...trailing image object with no slug should be ignored...' +
  '{\\"id\\":\\"99999999-0000-0000-0000-000000000000\\",\\"width\\":301}' +
  '"])';

check('parseVenues extracts every tenant object', () => {
  const venues = PlaytomicProvider.parseVenues(cityPageFixture);
  assert.equal(venues.length, 2);
});

check('parseVenues maps id/name/slug/address', () => {
  const venues = PlaytomicProvider.parseVenues(cityPageFixture);
  const hive = venues.find((v) => v.slug === 'the-hive-london');
  assert.ok(hive, 'the-hive-london present');
  assert.equal(hive.id, '4ab18f91-d6bb-440e-b890-4d5422a786fc');
  assert.equal(hive.name, 'The Hive London'); // trimmed
  assert.equal(hive.address, 'Camrose Avenue, Edgware, HA8 6AG');
});

check('parseVenues extracts UK postcode from the address string', () => {
  const venues = PlaytomicProvider.parseVenues(cityPageFixture);
  const hive = venues.find((v) => v.slug === 'the-hive-london');
  assert.equal(hive.postcode, 'HA8 6AG');
});

check('parseVenues ignores non-venue id-objects (no slug/address)', () => {
  const venues = PlaytomicProvider.parseVenues(cityPageFixture);
  assert.ok(
    !venues.some((v) => v.id === '99999999-0000-0000-0000-000000000000')
  );
});

check('parseVenues dedupes repeated tenant objects by id', () => {
  const dup = cityPageFixture + cityPageFixture;
  const venues = PlaytomicProvider.parseVenues(dup);
  assert.equal(venues.length, 2);
});

check('parseVenues returns [] for an empty / non-matching page', () => {
  assert.deepEqual(PlaytomicProvider.parseVenues(''), []);
  assert.deepEqual(PlaytomicProvider.parseVenues('<html>no data</html>'), []);
});

// ---------------------------------------------------------------------------
// Availability: getVenueAvailability transforms the BFF JSON into slots.
// We stub httpRequest so the transform is tested without a network call.
// ---------------------------------------------------------------------------
const availabilityFixture = JSON.stringify([
  {
    resource_id: '8b9ddab2-6101-4678-8659-cc32bce6569a',
    start_date: '2026-07-20',
    slots: [
      { start_time: '06:00:00', duration: 60, price: '48 GBP' },
      { start_time: '06:00:00', duration: 90, price: '72 GBP' },
    ],
  },
]);

function providerWithStub(response) {
  const provider = new PlaytomicProvider();
  provider._currentSport = 'padel';
  let calledUrl = null;
  provider.httpRequest = async (url) => {
    calledUrl = url;
    return response;
  };
  provider.__lastUrl = () => calledUrl;
  return provider;
}

const venue = {
  id: '4ab18f91-d6bb-440e-b890-4d5422a786fc',
  name: 'The Hive London',
  slug: 'the-hive-london',
  address: 'Camrose Avenue, Edgware, HA8 6AG',
  postcode: 'HA8 6AG',
};

check('getVenueAvailability hits the same-origin BFF endpoint', async () => {
  const provider = providerWithStub(availabilityFixture);
  await provider.getVenueAvailability(venue, '2026-07-20');
  const url = provider.__lastUrl();
  assert.ok(
    url.startsWith('https://playtomic.com/api/clubs/availability?'),
    `unexpected url: ${url}`
  );
  assert.ok(url.includes('tenant_id=4ab18f91-d6bb-440e-b890-4d5422a786fc'));
  assert.ok(url.includes('date=2026-07-20'));
  assert.ok(url.includes('sport_id=PADEL'));
});

check('getVenueAvailability transforms every slot', async () => {
  const provider = providerWithStub(availabilityFixture);
  const slots = await provider.getVenueAvailability(venue, '2026-07-20');
  assert.equal(slots.length, 2);
});

check(
  'getVenueAvailability normalizes price to pence and time to UTC ISO',
  async () => {
    const provider = providerWithStub(availabilityFixture);
    const [slot] = await provider.getVenueAvailability(venue, '2026-07-20');
    assert.equal(slot.provider, 'playtomic');
    assert.equal(slot.price, 4800); // "48 GBP" -> pence
    assert.equal(slot.currency, 'GBP');
    assert.equal(slot.duration, 60);
    assert.equal(slot.startTime, '2026-07-20T06:00:00.000Z');
    assert.equal(slot.endTime, '2026-07-20T07:00:00.000Z');
    assert.equal(slot.venue.id, venue.id);
  }
);

check(
  'getVenueAvailability booking link uses the /clubs/{slug} scheme',
  async () => {
    const provider = providerWithStub(availabilityFixture);
    const [slot] = await provider.getVenueAvailability(venue, '2026-07-20');
    assert.equal(
      slot.link,
      'https://playtomic.com/clubs/the-hive-london?sport=PADEL&date=2026-07-20'
    );
  }
);

check('getVenueAvailability returns [] for a non-array body', async () => {
  const provider = providerWithStub('{"error":"nope"}');
  const slots = await provider.getVenueAvailability(venue, '2026-07-20');
  assert.deepEqual(slots, []);
});

// ---------------------------------------------------------------------------
// Run all queued checks in order, then summarize.
// ---------------------------------------------------------------------------
(async () => {
  for (const run of queue) await run();
  console.log('');
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
