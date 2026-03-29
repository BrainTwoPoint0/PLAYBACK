/**
 * Goals Soccer Centres Provider for AWS Lambda
 * Uses the Adactus/ServiceStack REST API for football pitch availability.
 *
 * Endpoints:
 *   GET /branches — list all venues
 *   GET /branches/{id}/bookingoptions — pitch types + bookable dates
 *   GET /branches/{id}/availability?bookingDate=...&productId=... — available slots
 */

const https = require('https');
const { URL } = require('url');
const { getUKOffset } = require('../utils');

// London Goals venues (locationId=4, excluding Reading/Southend/Dartford which are outside London)
const LONDON_VENUES = [
  {
    id: 32,
    name: 'Goals Beckenham',
    postcode: 'BR3 4EJ',
    url: '/our-clubs/south-east/beckenham',
  },
  {
    id: 11,
    name: 'Goals Bexleyheath',
    postcode: 'DA6 7EG',
    url: '/our-clubs/south-east/bexleyheath',
  },
  {
    id: 50,
    name: 'Goals Chingford',
    postcode: 'E4 8SN',
    url: '/our-clubs/south-east/chingford',
  },
  {
    id: 12,
    name: 'Goals Dagenham',
    postcode: 'RM9 6XW',
    url: '/our-clubs/south-east/dagenham',
  },
  {
    id: 60,
    name: 'Goals Eltham',
    postcode: 'SE9 5LU',
    url: '/our-clubs/south-east/eltham',
  },
  {
    id: 62,
    name: 'Goals Gillette Corner',
    postcode: 'TW7 5DB',
    url: '/our-clubs/south-east/gillette-corner',
  },
  {
    id: 46,
    name: 'Goals Hayes',
    postcode: 'UB4 0LP',
    url: '/our-clubs/south-east/hayes',
  },
  {
    id: 28,
    name: 'Goals Heathrow',
    postcode: 'UB3 1LL',
    url: '/our-clubs/south-east/heathrow',
  },
  {
    id: 1,
    name: 'Goals Ruislip',
    postcode: 'HA4 0JE',
    url: '/our-clubs/south-east/ruislip',
  },
  {
    id: 34,
    name: 'Goals Sutton',
    postcode: 'SM3 9BY',
    url: '/our-clubs/south-east/sutton',
  },
  {
    id: 55,
    name: 'Goals Tolworth',
    postcode: 'KT5 9NT',
    url: '/our-clubs/south-east/tolworth',
  },
  {
    id: 2,
    name: 'Goals Wembley',
    postcode: 'HA0 1JH',
    url: '/our-clubs/south-east/wembley',
  },
  {
    id: 9,
    name: 'Goals Wimbledon',
    postcode: 'KT3 4PH',
    url: '/our-clubs/south-east/wimbledon',
  },
];

// Pitch types to collect
const PITCH_TYPES = [
  { productId: 72, name: '5-a-side' },
  { productId: 74, name: '7-a-side' },
  { productId: 225, name: '8-a-side' },
];

class GoalsProvider {
  constructor() {
    this.baseUrl = 'https://api.goalsfootball.co.uk';
    this.apiKey = process.env.GOALS_API_KEY;
    if (!this.apiKey) {
      console.warn('GOALS_API_KEY not set — Goals provider will be skipped');
    }
  }

  async fetchAvailability(params) {
    const { date } = params;

    if (!this.apiKey) return [];

    console.log(`🔍 Fetching Goals data for ${date}`);

    const allSlots = [];

    for (const venue of LONDON_VENUES) {
      try {
        const venueSlots = await this.getVenueAvailability(venue, date);
        allSlots.push(...venueSlots);
      } catch (error) {
        // "Invalid search time" = booking window closed for this date (normal for today late)
        if (!error.message.includes('6002')) {
          console.warn(`Goals failed for ${venue.name}: ${error.message}`);
        }
      }

      // Rate limit between venues
      await this.sleep(300);
    }

    console.log(
      `✅ Goals: collected ${allSlots.length} slots from ${LONDON_VENUES.length} venues`
    );
    return allSlots;
  }

  async getVenueAvailability(venue, date) {
    const bookingDate = `${date}T00:00`;
    const allSlots = [];

    for (const pitchType of PITCH_TYPES) {
      try {
        const slots = await this.getVenueAvailabilityForType(
          venue,
          date,
          bookingDate,
          pitchType
        );
        allSlots.push(...slots);
      } catch (error) {
        // Some venues don't have all pitch types — skip silently
        if (
          !error.message.includes('6002') &&
          !error.message.includes('6001')
        ) {
          console.warn(
            `Goals ${venue.name} ${pitchType.name}: ${error.message}`
          );
        }
      }
      await this.sleep(100);
    }

    return allSlots;
  }

  async getVenueAvailabilityForType(venue, date, bookingDate, pitchType) {
    const url = `${this.baseUrl}/branches/${venue.id}/availability?bookingDate=${encodeURIComponent(bookingDate)}&productId=${pitchType.productId}`;

    const response = await this.httpRequest(url);
    const data = JSON.parse(response);
    const bookings = data.availableBookings || [];

    const slots = [];
    for (const booking of bookings) {
      if (!booking.isAvailable && booking.isAvailable !== undefined) continue;

      const resources = booking.availableResources || [];

      // Create one slot per available pitch
      for (const resource of resources) {
        const tzOffset = getUKOffset(date);
        const startTime = new Date(booking.startDateTime + tzOffset);
        const endTime = new Date(booking.endDateTime + tzOffset);

        slots.push({
          provider: 'goals',
          sport: 'football',
          listingType: 'pitch_hire',
          venue: {
            id: String(venue.id),
            name: venue.name,
            slug: `goals-${venue.name.replace('Goals ', '').toLowerCase().replace(/\s+/g, '-')}`,
            address: '',
            postcode: venue.postcode,
            latitude: 0,
            longitude: 0,
            indoor: false,
            surface: '3G',
            amenities: [],
          },
          court: {
            id: String(resource.id || resource.resourceId || ''),
            name: `${pitchType.name} - ${resource.name || resource.description || 'Pitch'}`,
            surface: '3G',
          },
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: booking.durationInMinutes || 60,
          price: Math.round((booking.price || 0) * 100),
          currency: 'GBP',
          available: true,
          link: `https://www.goalsfootball.co.uk${venue.url}`,
        });
      }
    }

    return slots;
  }

  httpRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const req = https.request(
        {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {
            'Api-Key': this.apiKey,
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
          timeout: 10000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(
                new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`)
              );
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = { GoalsProvider };
