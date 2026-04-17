/**
 * Footy Addicts Provider for AWS Lambda
 * Scrapes footyaddicts.com listing pages for drop-in football games in London.
 *
 * All data (venue, time, price, format) is extracted from the listing page HTML
 * — no individual game page fetches needed.
 */

const https = require('https');
const { URL } = require('url');
const cheerio = require('cheerio');
// Uses Intl.DateTimeFormat for UK timezone handling (no external deps)

class FootyAddictsProvider {
  constructor() {
    this.baseUrl = 'https://footyaddicts.com';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    this.maxPages = 4;
  }

  async fetchAvailability(params) {
    const { date } = params;

    if (!this._allGames) {
      this._allGames = {};
      await this.scrapeListings();
    }

    return this._allGames[date] || [];
  }

  async scrapeListings() {
    console.log(
      `🎮 Scraping Footy Addicts (${this.maxPages} listing pages)...`
    );

    let totalGames = 0;

    for (let page = 1; page <= this.maxPages; page++) {
      try {
        const url =
          page === 1
            ? `${this.baseUrl}/football-games/`
            : `${this.baseUrl}/football-games/?page=${page}`;

        const html = await this.httpRequest(url);
        const games = this.parseListingPage(html);

        for (const game of games) {
          const gameDate = game.startTime.split('T')[0];
          if (!this._allGames[gameDate]) this._allGames[gameDate] = [];
          this._allGames[gameDate].push(game);
          totalGames++;
        }

        await this.sleep(500);
      } catch (error) {
        console.warn(`Footy Addicts page ${page}: ${error.message}`);
      }
    }

    console.log(
      `  ✅ Footy Addicts: ${totalGames} games from ${this.maxPages} pages`
    );
  }

  parseListingPage(html) {
    const $ = cheerio.load(html);
    const games = [];
    const now = Date.now();

    // Each date section is a div whose first child holds the date label
    // (class "text-black mb-2 ml-1 text-xs font-medium uppercase tracking-wider")
    // and whose second child holds the game cards.
    $('div.text-black.uppercase.tracking-wider').each((_, labelEl) => {
      const dateLabel = $(labelEl).text().trim();
      const ukDate = this.parseDateLabel(dateLabel);
      if (!ukDate) return;

      const $section = $(labelEl).parent();
      $section.find('a.group.block').each((_, cardEl) => {
        try {
          const $card = $(cardEl);
          const href = $card.attr('href') || '';

          if (!href.match(/\/football-games\/\d+/)) return;
          if (!href.includes('london') && !href.includes('greater-london'))
            return;

          const venueName = $card.find('p.truncate').first().text().trim();

          // Time: first span with HH:MM (24-hour)
          let timeText = '';
          $card.find('span').each((_, sp) => {
            if (timeText) return;
            const t = $(sp).text().trim();
            if (/^\d{1,2}:\d{2}$/.test(t)) timeText = t;
          });

          if (!venueName || !timeText) return;

          const startTime = this.buildUkDateTime(ukDate, timeText);
          if (
            !startTime ||
            isNaN(startTime.getTime()) ||
            startTime.getTime() < now
          )
            return;

          // Price lives in a div with class text-lg font-medium leading-none,
          // and reads either "Free" or "£N" / "£N.NN".
          let priceText = '';
          $card.find('div.text-lg.font-medium').each((_, pe) => {
            if (priceText) return;
            const t = $(pe).text().trim();
            if (/^free$/i.test(t) || /£\d/.test(t)) priceText = t;
          });
          const priceMatch = priceText.match(/£(\d+(?:\.\d+)?)/);
          const price = priceMatch
            ? Math.round(parseFloat(priceMatch[1]) * 100)
            : 0;

          // Format badge text (e.g. "5v5", "6v6", "7v7")
          let formatBadge = '';
          $card.find('span').each((_, sp) => {
            if (formatBadge) return;
            const t = $(sp).text().trim().toLowerCase();
            if (/^\d+v\d+$/.test(t)) formatBadge = t;
          });
          const format = formatBadge || 'Football';

          const idMatch = href.match(/\/(\d+)-/);
          const gameId = idMatch ? idMatch[1] : href.split('/').pop();

          const slugMatch = href.match(/\/\d+-(.+)$/);
          const venueSlug = slugMatch
            ? slugMatch[1]
            : venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

          const endTime = new Date(startTime.getTime() + 60 * 60000);

          games.push({
            provider: 'footy_addicts',
            sport: 'football',
            listingType: 'drop_in',
            venue: {
              id: `fa-${venueSlug}`,
              name: venueName,
              slug: venueSlug,
              address: '',
              postcode: '',
              latitude: 0,
              longitude: 0,
              indoor: false,
              surface: 'artificial',
              amenities: [],
            },
            court: {
              id: gameId,
              name: `${format} Game`,
              surface: 'artificial',
            },
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: 60,
            price,
            currency: 'GBP',
            available: true,
            link: `${this.baseUrl}${href}`,
          });
        } catch (e) {
          console.warn(`  Card parse error: ${e.message}`);
        }
      });
    });

    return games;
  }

  /**
   * Parse a section-header date label into a UK-calendar ISO date (YYYY-MM-DD).
   * Accepts "Today", "Tomorrow", and full forms like "Sunday, 19 April 2026".
   */
  parseDateLabel(label) {
    if (!label) return null;
    const lower = label.toLowerCase();

    const ukFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    if (lower.includes('today')) {
      return ukFormatter.format(new Date());
    }
    if (lower.includes('tomorrow')) {
      return ukFormatter.format(new Date(Date.now() + 86400000));
    }

    // Full form: "Sunday, 19 April 2026" or "19 April 2026"
    const months = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };
    const m = label.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = months[m[2].toLowerCase()];
    const year = parseInt(m[3], 10);
    if (!month || !day || !year) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /**
   * Combine a UK date (YYYY-MM-DD) and HH:MM into a UTC Date, handling BST/GMT.
   */
  buildUkDateTime(ukDate, timeText) {
    const m = timeText.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hours = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    if (hours > 23 || minutes > 59) return null;

    const utcGuess = new Date(
      `${ukDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`
    );
    const ukParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(utcGuess);
    const ukHour = parseInt(
      ukParts.find((p) => p.type === 'hour')?.value || '0',
      10
    );
    const offsetHours = ukHour - utcGuess.getUTCHours();
    const result = new Date(utcGuess.getTime() - offsetHours * 3600000);
    return isNaN(result.getTime()) ? null : result;
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
