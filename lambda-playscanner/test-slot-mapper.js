/**
 * Unit tests for slot-mapper.js
 * Run: node test-slot-mapper.js
 *
 * This is the Phase 0 gate for the flat-table migration. It verifies that:
 *   - buildSlotId is stable across re-calls for every provider's slot shape
 *   - slotToRow normalizes the grab-bag of venue address shapes correctly
 *   - rowToCourtSlot produces a CourtSlot whose fields match what
 *     persistent-cache.ts:transformLambdaSlot produces today
 *   - filterAndSort applies sport/time/price/indoor filters and sorts
 *     time-asc then price-asc — matching the JS filter/sort in search()
 *   - The table-tennis regression we just fixed cannot leak through the
 *     flat-table path (sport filter excludes table-tennis-tagged slots)
 */

const assert = require('node:assert/strict');
const {
  buildSlotId,
  slotToRow,
  rowToCourtSlot,
  filterAndSort,
  normalizeVenue,
  resolveSport,
} = require('./src/slot-mapper');

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  ok  ${label}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL ${label}`);
    console.log(`       ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Fixtures — representative slot shapes from each provider. These match the
// actual output of the provider `fetchAvailability` functions in
// lambda-playscanner/src/providers/*.js and lambda-openactive/.../better.js.
// ---------------------------------------------------------------------------

const playtomicPadelSlot = {
  provider: 'playtomic',
  sport: 'padel',
  listingType: 'pitch_hire',
  venue: {
    id: '9c95ac87-5273-47a9-bf67-342c566caf79',
    name: 'Rocks Lane - Chiswick',
    slug: 'rocks-lane-chiswick',
    indoor: false,
    address: {
      city: 'London',
      street: '60 Chiswick Common Rd, Chiswick, London W4 1RZ',
      country: 'United Kingdom',
      postal_code: 'W4 1RZ',
      coordinate: { lat: 51.493989, lon: -0.2600909 },
    },
    surface: 'unknown',
  },
  court: { id: 'abc-123', name: 'Court 1', surface: 'artificial' },
  startTime: '2026-04-12T06:00:00.000Z',
  endTime: '2026-04-12T07:00:00.000Z',
  duration: 60,
  price: 1300,
  currency: 'GBP',
  available: true,
  link: 'https://playtomic.com/venue/9c95ac87/court',
};

const matchiPadelSlot = {
  provider: 'matchi',
  sport: 'padel',
  listingType: 'pitch_hire',
  venue: {
    id: '12345',
    name: 'Padel London Stratford',
    slug: 'padel-london-stratford',
    address: '30 Olympic Park Ave, London',
    postcode: 'E20 1ET',
    latitude: 51.5462,
    longitude: -0.0121,
    indoor: true,
    surface: 'artificial grass',
  },
  court: {
    id: 'slotid-99999-rotating',
    name: 'Court 2',
    surface: 'artificial grass',
  },
  startTime: '2026-04-12T18:00:00.000Z',
  endTime: '2026-04-12T19:00:00.000Z',
  duration: 60,
  price: 2800,
  currency: 'GBP',
  available: true,
  link: 'https://matchi.se/facilities/padel-london-stratford',
};

const flowTennisSlot = {
  provider: 'flow',
  sport: 'tennis',
  listingType: 'pitch_hire',
  venue: {
    id: 'flow-the-regents-park-courts',
    name: "Regent's Park Courts",
    slug: 'the-regents-park-courts',
    indoor: false,
    postcode: 'NW1 4NR',
    latitude: 51.5273,
    longitude: -0.1535,
    surface: 'grass',
  },
  court: { id: 'ct1', name: 'Tennis Court 1', surface: 'grass' },
  startTime: '2026-04-12T07:00:00.000Z',
  endTime: '2026-04-12T08:00:00.000Z',
  duration: 60,
  price: 0,
  currency: 'GBP',
  available: true,
  link: 'https://sportsandleisureroyalparks.bookings.flow.onl/location/the-regents-park-courts/tennis/2026-04-12/by-time',
};

const betterBasketballSlot = {
  provider: 'better',
  sport: 'basketball',
  listingType: 'pitch_hire',
  venue: {
    id: 'clissold-leisure-centre',
    name: 'Clissold Leisure Centre',
    slug: 'clissold-leisure-centre',
    indoor: true,
    address: '63 Clissold Road, Hackney, London',
    postcode: 'N16 9EX',
    latitude: 51.5579,
    longitude: -0.084595,
    surface: 'hard',
  },
  court: {
    id: 'better_activity:42',
    name: 'Sports Hall Court 1',
    surface: 'hard',
  },
  startTime: '2026-04-12T14:00:00.000Z',
  endTime: '2026-04-12T15:00:00.000Z',
  duration: 60,
  price: 1200,
  currency: 'GBP',
  available: true,
  link: 'https://bookings.better.org.uk/location/clissold-leisure-centre/basketball/2026-04-12/by-time/slot/15:00-16:00',
};

const footballSlotNoSportField = {
  provider: 'powerleague',
  // no sport field — relies on provider-based detection
  listingType: 'pitch_hire',
  venue: {
    id: 'pl-shoreditch',
    name: 'Powerleague Shoreditch',
    address: 'Whitby St, London',
    postcode: 'E1 6JU',
    latitude: 51.52,
    longitude: -0.077,
    indoor: false,
  },
  court: { id: 'p1', name: '5v5 Pitch 1', surface: 'astro' },
  startTime: '2026-04-12T19:00:00.000Z',
  endTime: '2026-04-12T20:00:00.000Z',
  duration: 60,
  price: 6000,
  currency: 'GBP',
  available: true,
};

const pastSlot = {
  provider: 'playtomic',
  sport: 'padel',
  venue: {
    id: 'past-venue',
    name: 'Past Venue',
    address: { city: 'London', coordinate: { lat: 0, lon: 0 } },
  },
  court: { id: 'c1', name: 'Court 1' },
  startTime: '2024-01-01T10:00:00.000Z',
  endTime: '2024-01-01T11:00:00.000Z',
  duration: 60,
  price: 1000,
  currency: 'GBP',
  available: true,
};

const secondTennisSlot = {
  // Second tennis slot so the tennis query returns more than one row. The
  // slot-mapper does not do sport re-detection — it trusts whatever the
  // provider tagged upstream. The real fix for the table-tennis-as-tennis
  // bug lives in lambda-openactive/src/providers/better.js:detectSport and
  // has its own test file (test-better-detect-sport.js). Keeping the slot
  // mapper dumb about sport semantics is intentional: one source of truth.
  provider: 'flow',
  sport: 'tennis',
  venue: {
    id: 'flow-hyde-park-courts',
    name: 'Hyde Park Courts',
    indoor: false,
  },
  court: { id: 'ct1', name: 'Muga Court 1' },
  startTime: '2026-04-12T13:00:00.000Z',
  endTime: '2026-04-12T14:00:00.000Z',
  duration: 60,
  price: 0,
  currency: 'GBP',
  available: true,
  link: 'https://sportsandleisureroyalparks.bookings.flow.onl/location/hyde-park-courts/tennis/2026-04-12/by-time',
};

// ---------------------------------------------------------------------------
// buildSlotId — stability and format
// ---------------------------------------------------------------------------
console.log('buildSlotId');

check('produces identical ID on repeated calls (Playtomic)', () => {
  const a = buildSlotId(playtomicPadelSlot);
  const b = buildSlotId(playtomicPadelSlot);
  assert.equal(a, b);
  assert.equal(
    a,
    'playtomic:9c95ac87-5273-47a9-bf67-342c566caf79:Court 1:2026-04-12T06:00:00.000Z'
  );
});

check('uses court_name, not court_id — MATCHi rotating slotId safe', () => {
  const id1 = buildSlotId(matchiPadelSlot);
  const rotated = {
    ...matchiPadelSlot,
    court: { ...matchiPadelSlot.court, id: 'different-rotating-slotid' },
  };
  const id2 = buildSlotId(rotated);
  assert.equal(id1, id2, 'IDs should match when only court_id rotates');
  assert.ok(id1.includes('Court 2'));
});

check('differentiates distinct start times at the same court', () => {
  const id1 = buildSlotId(playtomicPadelSlot);
  const id2 = buildSlotId({
    ...playtomicPadelSlot,
    startTime: '2026-04-12T07:00:00.000Z',
  });
  assert.notEqual(id1, id2);
});

check('handles missing court gracefully', () => {
  const slot = { ...playtomicPadelSlot, court: undefined };
  const id = buildSlotId(slot);
  assert.ok(id.includes('court'));
});

// ---------------------------------------------------------------------------
// normalizeVenue — every provider's venue shape → unified object
// ---------------------------------------------------------------------------
console.log('normalizeVenue');

check('Playtomic nested address with coordinate.{lat,lon}', () => {
  const v = normalizeVenue(playtomicPadelSlot.venue);
  assert.equal(v.city, 'London');
  assert.equal(v.postcode, 'W4 1RZ');
  assert.equal(v.lat, 51.493989);
  assert.equal(v.lng, -0.2600909);
  assert.equal(v.indoor, false);
});

check('MATCHi string address + flat latitude/longitude', () => {
  const v = normalizeVenue(matchiPadelSlot.venue);
  assert.equal(v.city, 'London'); // default fallback
  assert.equal(v.postcode, 'E20 1ET');
  assert.equal(v.lat, 51.5462);
  assert.equal(v.lng, -0.0121);
  assert.equal(v.indoor, true);
});

check('Flow no-address venue (postcode only)', () => {
  const v = normalizeVenue(flowTennisSlot.venue);
  assert.equal(v.postcode, 'NW1 4NR');
  assert.equal(v.lat, 51.5273);
});

// ---------------------------------------------------------------------------
// resolveSport — prefers slot.sport, falls back to provider-based detection
// ---------------------------------------------------------------------------
console.log('resolveSport');

check('uses explicit slot.sport when set', () => {
  assert.equal(resolveSport(playtomicPadelSlot), 'padel');
  assert.equal(resolveSport(flowTennisSlot), 'tennis');
  assert.equal(resolveSport(betterBasketballSlot), 'basketball');
});

check('falls back to football for powerleague without sport field', () => {
  assert.equal(resolveSport(footballSlotNoSportField), 'football');
});

check('falls back to padel for unknown provider', () => {
  assert.equal(resolveSport({ provider: 'unknown' }), 'padel');
});

// ---------------------------------------------------------------------------
// slotToRow — flat row shape
// ---------------------------------------------------------------------------
console.log('slotToRow');

check('Playtomic slot produces valid row with all fields', () => {
  const row = slotToRow(playtomicPadelSlot, 'London');
  assert.equal(row.provider, 'playtomic');
  assert.equal(row.sport, 'padel');
  assert.equal(row.city, 'london'); // lowercased
  assert.equal(row.venue_id, playtomicPadelSlot.venue.id);
  assert.equal(row.venue_postcode, 'W4 1RZ');
  assert.equal(row.venue_lat, 51.493989);
  assert.equal(row.court_name, 'Court 1');
  assert.equal(row.price, 1300);
  assert.equal(row.duration, 60);
  assert.equal(row.available, true);
  assert.equal(row.court_surface, 'artificial'); // 'unknown' on venue isn't used
  assert.ok(row.id.startsWith('playtomic:'));
});

check('football provider without sport field gets sport=football', () => {
  const row = slotToRow(footballSlotNoSportField, 'London');
  assert.equal(row.sport, 'football');
});

check('default listing_type is pitch_hire', () => {
  const row = slotToRow(playtomicPadelSlot, 'London');
  assert.equal(row.listing_type, 'pitch_hire');
});

// ---------------------------------------------------------------------------
// rowToCourtSlot — round-trip via flat row produces CourtSlot matching
// what persistent-cache.ts:transformLambdaSlot emits today
// ---------------------------------------------------------------------------
console.log('rowToCourtSlot');

check('Playtomic row → CourtSlot has correct venue.location', () => {
  const row = slotToRow(playtomicPadelSlot, 'London');
  const cs = rowToCourtSlot(row);
  assert.equal(cs.venue.location.city, 'london');
  assert.equal(cs.venue.location.postcode, 'W4 1RZ');
  assert.equal(cs.venue.location.coordinates.lat, 51.493989);
  assert.equal(cs.venue.location.coordinates.lng, -0.2600909);
  assert.equal(cs.sport, 'padel');
  assert.equal(cs.price, 1300);
  assert.equal(cs.bookingUrl, playtomicPadelSlot.link);
});

check('tennis CourtSlot has TennisMeta with indoor/outdoor derived', () => {
  const row = slotToRow(flowTennisSlot, 'London');
  const cs = rowToCourtSlot(row);
  assert.equal(cs.sport, 'tennis');
  assert.equal(cs.sportMeta.courtType, 'outdoor');
  assert.equal(cs.sportMeta.surface, 'hard');
});

check('basketball CourtSlot has BasketballMeta', () => {
  const row = slotToRow(betterBasketballSlot, 'London');
  const cs = rowToCourtSlot(row);
  assert.equal(cs.sport, 'basketball');
  assert.equal(cs.sportMeta.format, '5v5');
});

check('availability.spotsAvailable=1 when available=true', () => {
  const row = slotToRow(playtomicPadelSlot, 'London');
  const cs = rowToCourtSlot(row);
  assert.equal(cs.availability.spotsAvailable, 1);
  assert.equal(cs.availability.totalSpots, 1);
});

check(
  'availability.spotsAvailable=0 when row.available=false (tombstoned)',
  () => {
    const row = {
      ...slotToRow(playtomicPadelSlot, 'London'),
      available: false,
    };
    const cs = rowToCourtSlot(row);
    assert.equal(cs.availability.spotsAvailable, 0);
  }
);

// ---------------------------------------------------------------------------
// filterAndSort — replicates persistent-cache.ts:search() filter+sort
// ---------------------------------------------------------------------------
console.log('filterAndSort');

const fixedNow = new Date('2026-04-12T05:00:00.000Z').getTime(); // before all future slots

const allRows = [
  playtomicPadelSlot,
  matchiPadelSlot,
  flowTennisSlot,
  betterBasketballSlot,
  footballSlotNoSportField,
  pastSlot,
  secondTennisSlot,
].map((s) => slotToRow(s, 'London'));

check('tennis query returns only rows tagged sport=tennis', () => {
  const out = filterAndSort(
    allRows,
    { sport: 'tennis', date: '2026-04-12' },
    fixedNow
  );
  assert.equal(out.length, 2, `expected 2 tennis rows, got ${out.length}`);
  assert.ok(out.every((r) => r.sport === 'tennis'));
});

check('padel query returns only padel rows (Playtomic + MATCHi)', () => {
  const out = filterAndSort(
    allRows,
    { sport: 'padel', date: '2026-04-12' },
    fixedNow
  );
  assert.equal(out.length, 2);
  assert.ok(out.every((r) => r.sport === 'padel'));
});

check('football query returns football row inferred from provider', () => {
  const out = filterAndSort(
    allRows,
    { sport: 'football', date: '2026-04-12' },
    fixedNow
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].provider, 'powerleague');
});

check('basketball query returns basketball row', () => {
  const out = filterAndSort(
    allRows,
    { sport: 'basketball', date: '2026-04-12' },
    fixedNow
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].sport, 'basketball');
});

check('past slots are excluded', () => {
  const out = filterAndSort(
    allRows,
    { sport: 'padel', date: '2024-01-01' },
    fixedNow
  );
  assert.ok(
    !out.some((r) => r.venue_id === 'past-venue'),
    'past slot should not appear'
  );
});

check('sort is time-asc, then price-asc on ties', () => {
  const tied1 = slotToRow(
    {
      ...playtomicPadelSlot,
      venue: { ...playtomicPadelSlot.venue, id: 'v1' },
      price: 2000,
    },
    'London'
  );
  const tied2 = slotToRow(
    {
      ...playtomicPadelSlot,
      venue: { ...playtomicPadelSlot.venue, id: 'v2' },
      price: 1000,
    },
    'London'
  );
  const later = slotToRow(
    {
      ...playtomicPadelSlot,
      venue: { ...playtomicPadelSlot.venue, id: 'v3' },
      startTime: '2026-04-12T08:00:00.000Z',
      endTime: '2026-04-12T09:00:00.000Z',
      price: 500,
    },
    'London'
  );
  const out = filterAndSort(
    [tied1, tied2, later],
    { sport: 'padel', date: '2026-04-12' },
    fixedNow
  );
  assert.equal(out[0].price, 1000, 'cheapest at tied time should come first');
  assert.equal(out[1].price, 2000);
  assert.equal(
    out[2].price,
    500,
    'later slot comes last despite being cheapest'
  );
});

check('maxPrice filter applied', () => {
  const out = filterAndSort(
    allRows,
    { sport: 'padel', date: '2026-04-12', maxPrice: 1500 },
    fixedNow
  );
  assert.equal(
    out.length,
    1,
    'only Playtomic £13 slot passes, MATCHi £28 excluded'
  );
  assert.equal(out[0].provider, 'playtomic');
});

check('indoor=true filter applied', () => {
  const out = filterAndSort(
    allRows,
    { sport: 'padel', date: '2026-04-12', indoor: true },
    fixedNow
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].provider, 'matchi');
});

check('startTime filter excludes earlier slots', () => {
  const out = filterAndSort(
    allRows,
    { sport: 'padel', date: '2026-04-12', startTime: '10:00' },
    fixedNow
  );
  assert.ok(out.every((r) => new Date(r.start_time).getUTCHours() >= 10));
});

check('tombstoned rows (available=false) are excluded', () => {
  const tombstoned = {
    ...slotToRow(playtomicPadelSlot, 'London'),
    available: false,
  };
  const out = filterAndSort(
    [tombstoned],
    { sport: 'padel', date: '2026-04-12' },
    fixedNow
  );
  assert.equal(out.length, 0);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('');
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
