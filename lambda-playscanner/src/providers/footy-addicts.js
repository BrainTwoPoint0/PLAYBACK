/**
 * Footy Addicts Provider for AWS Lambda
 * Scrapes footyaddicts.com for drop-in football games in London.
 *
 * Two-step approach:
 *   1. Fetch game listing pages to find London game URLs
 *   2. Fetch individual game pages for Schema.org JSON-LD data
 */

const https = require('https');
const { URL } = require('url');
const cheerio = require('cheerio');

class FootyAddictsProvider {
  constructor() {
    this.baseUrl = 'https://footyaddicts.com';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    // Max listing pages to scrape per run (25 games per page)
    this.maxPages = 3;
  }

  /**
   * Fetch availability for a given date.
   * Scrapes listing pages once, then returns games for the requested date.
   */
  async fetchAvailability(params) {
    const { date } = params;

    // Only scrape once per collection run
    if (!this._allGames) {
      this._allGames = {};
      await this.scrapeGames();
    }

    return this._allGames[date] || [];
  }

  /**
   * Scrape game listing pages and fetch individual game data
   */
  async scrapeGames() {
    console.log(`🎮 Scraping Footy Addicts (${this.maxPages} pages)...`);

    const gameUrls = [];

    // Step 1: Get London game URLs from listing pages
    for (let page = 1; page <= this.maxPages; page++) {
      try {
        const url =
          page === 1
            ? `${this.baseUrl}/football-games/`
            : `${this.baseUrl}/football-games/?page=${page}`;

        const html = await this.httpRequest(url);
        const $ = cheerio.load(html);

        $('a[href*="/football-games/"]').each((_, el) => {
          const href = $(el).attr('href') || '';
          if (
            href.match(/\/football-games\/\d+/) &&
            (href.includes('london') || href.includes('greater-london'))
          ) {
            const fullUrl = href.startsWith('http')
              ? href
              : `${this.baseUrl}${href}`;
            if (!gameUrls.includes(fullUrl)) {
              gameUrls.push(fullUrl);
            }
          }
        });

        await this.sleep(500);
      } catch (error) {
        console.warn(`Footy Addicts page ${page} failed: ${error.message}`);
      }
    }

    console.log(`  Found ${gameUrls.length} London games`);

    // Step 2: Fetch each game page for Schema.org data
    let collected = 0;
    for (const gameUrl of gameUrls) {
      try {
        const slot = await this.fetchGameData(gameUrl);
        if (slot) {
          const slotDate = slot.startTime.split('T')[0];
          if (!this._allGames[slotDate]) this._allGames[slotDate] = [];
          this._allGames[slotDate].push(slot);
          collected++;
        }
      } catch (error) {
        // Skip individual game failures silently
      }

      await this.sleep(300);
    }

    console.log(`  ✅ Footy Addicts: ${collected} games collected`);
  }

  /**
   * Fetch a single game page and extract Schema.org SportsEvent data
   */
  async fetchGameData(gameUrl) {
    const html = await this.httpRequest(gameUrl);
    const $ = cheerio.load(html);

    // Find JSON-LD script
    const ldScript = $('script[type="application/ld+json"]').first().html();
    if (!ldScript) return null;

    const data = JSON.parse(ldScript);
    if (data['@type'] !== 'SportsEvent') return null;

    // Skip sold out / past games
    const availability = data.offers?.availability || '';
    if (availability.includes('SoldOut')) return null;

    const startDate = data.startDate ? new Date(data.startDate) : null;
    if (!startDate || isNaN(startDate.getTime())) return null;

    // Skip past games
    if (startDate.getTime() < Date.now()) return null;

    const endDate = data.endDate
      ? new Date(data.endDate)
      : new Date(startDate.getTime() + 60 * 60000);
    const durationMin = Math.round(
      (endDate.getTime() - startDate.getTime()) / 60000
    );

    const price = data.offers?.price || 0;
    const venueName = data.location?.name || 'Unknown Venue';
    const address = data.location?.address || {};

    // Extract game format from name (e.g. "8 a side football ...")
    const formatMatch = (data.name || '').match(/(\d+)\s*a?\s*-?\s*side/i);
    const format = formatMatch ? `${formatMatch[1]}-a-side` : 'Football';

    return {
      provider: 'footy_addicts',
      sport: 'football',
      listingType: 'drop_in',
      venue: {
        id: gameUrl.split('/').pop().split('-')[0], // game ID
        name: venueName,
        slug: venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        address: address.streetAddress || '',
        postcode: '',
        latitude: 0,
        longitude: 0,
        indoor: false,
        surface: 'artificial',
        amenities: [],
      },
      court: {
        id: gameUrl.split('/').pop().split('-')[0],
        name: `${format} Game`,
        surface: 'artificial',
      },
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: durationMin,
      price: Math.round(price * 100),
      currency: data.offers?.priceCurrency || 'GBP',
      available: true,
      link: data.url || gameUrl,
    };
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
            'Accept-Language': 'en-GB,en;q=0.9',
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

module.exports = { FootyAddictsProvider };
