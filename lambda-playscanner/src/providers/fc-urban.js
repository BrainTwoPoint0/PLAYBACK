/**
 * FC Urban Provider for AWS Lambda
 * Scrapes fcurban.com district pages for drop-in football sessions in London.
 *
 * Two-step approach:
 *   1. GET /locations-getLocationsPerArea?area=London — get districts
 *   2. GET /district/{slug} — HTML with session data per district
 */

const https = require('https');
const { URL } = require('url');

// London districts with approximate center coordinates
const LONDON_DISTRICTS = [
  { slug: 'camden', lat: 51.539, lng: -0.1426 },
  { slug: 'chelsea', lat: 51.4875, lng: -0.1687 },
  { slug: 'ealing', lat: 51.513, lng: -0.3089 },
  { slug: 'hackney', lat: 51.545, lng: -0.0553 },
  { slug: 'islington', lat: 51.5362, lng: -0.1033 },
  { slug: 'lambeth', lat: 51.4571, lng: -0.1231 },
  { slug: 'southwark', lat: 51.5035, lng: -0.0804 },
  { slug: 'tower-hamlets', lat: 51.515, lng: -0.034 },
  { slug: 'wandsworth', lat: 51.4567, lng: -0.191 },
  { slug: 'westminster', lat: 51.4975, lng: -0.1357 },
];

class FCUrbanProvider {
  constructor() {
    this.baseUrl = 'https://www.fcurban.com';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
  }

  async fetchAvailability(params) {
    const { date } = params;

    // Only scrape once per collection run
    if (!this._allGames) {
      this._allGames = {};
      await this.scrapeAllDistricts();
    }

    return this._allGames[date] || [];
  }

  async scrapeAllDistricts() {
    console.log(
      `🏙️ Scraping FC Urban (${LONDON_DISTRICTS.length} districts)...`
    );

    for (const district of LONDON_DISTRICTS) {
      try {
        const html = await this.httpRequest(
          `${this.baseUrl}/district/${district.slug}`
        );
        const sessions = this.parseSessions(html, district);

        for (const session of sessions) {
          const sessionDate = session.startTime.split('T')[0];
          if (!this._allGames[sessionDate]) this._allGames[sessionDate] = [];
          this._allGames[sessionDate].push(session);
        }
      } catch (error) {
        console.warn(`FC Urban ${district.slug}: ${error.message}`);
      }

      await this.sleep(500);
    }

    const total = Object.values(this._allGames).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    console.log(`  ✅ FC Urban: ${total} sessions collected`);
  }

  parseSessions(html, district) {
    const sessions = [];
    const now = Date.now();

    // Parse game-time attributes (ISO datetime strings)
    const timeRegex = /game-time="([^"]+)"/g;
    const locationRegex = /game-location[^>]*>([^<]*)</g;
    const peopleRegex = /game-people[^>]*>([^<]*)</g;
    const urlRegex = /session-url[^>]*href="([^"]+)"/g;

    const times = [];
    const locations = [];
    const people = [];
    const urls = [];

    let match;
    while ((match = timeRegex.exec(html)) !== null) times.push(match[1]);
    while ((match = locationRegex.exec(html)) !== null)
      locations.push(match[1].trim());
    while ((match = peopleRegex.exec(html)) !== null)
      people.push(match[1].trim());
    while ((match = urlRegex.exec(html)) !== null) urls.push(match[1]);

    // People appears twice per session (spots taken / total) — take every other
    const spotsTaken = [];
    for (let i = 0; i < people.length; i += 2) {
      spotsTaken.push(parseInt(people[i], 10) || 0);
    }

    for (let i = 0; i < times.length; i++) {
      const startTime = new Date(times[i]);
      if (isNaN(startTime.getTime())) continue;
      if (startTime.getTime() < now) continue;

      const endTime = new Date(startTime.getTime() + 60 * 60000); // 1 hour default
      const location = (locations[i] || district.slug)
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&');
      const url = urls[i] || '';
      const taken = spotsTaken[i] || 0;
      const spotsLeft = Math.max(0, 10 - taken); // FC Urban typically 10-player games

      if (spotsLeft <= 0) continue; // Skip full games

      sessions.push({
        provider: 'fc_urban',
        sport: 'football',
        listingType: 'drop_in',
        venue: {
          id: `fcurban-${district.slug}-${i}`,
          name: `FC Urban ${location}`,
          slug: `fc-urban-${district.slug}`,
          address: '',
          postcode: '',
          latitude: district.lat,
          longitude: district.lng,
          indoor: false,
          surface: 'artificial',
          amenities: [],
        },
        court: {
          id: url.split('/').pop() || `${district}-${i}`,
          name: 'Football Game',
          surface: 'artificial',
        },
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: 60,
        price: 799, // FC Urban is typically £7.99 per person
        currency: 'GBP',
        available: true,
        link: url || `https://play.fcurban.com`,
      });
    }

    return sessions;
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
            'User-Agent': this.userAgent,
            Accept: 'text/html',
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
              reject(new Error(`HTTP ${res.statusCode}`));
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

module.exports = { FCUrbanProvider };
