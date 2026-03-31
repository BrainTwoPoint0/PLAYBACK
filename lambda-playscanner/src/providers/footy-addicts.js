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

    $('a[href*="/football-games/"]').each((_, el) => {
      try {
        const $card = $(el);
        const href = $card.attr('href') || '';

        // Skip non-game links (must have a numeric ID)
        if (!href.match(/\/football-games\/\d+/)) return;

        // Only London games
        if (!href.includes('london') && !href.includes('greater-london'))
          return;

        // Venue name from h2
        const venueName = $card.find('h2').first().text().trim();

        // Time: first <p> with AM/PM
        let timeText = '';
        $card.find('p').each((_, p) => {
          const t = $(p).text().trim();
          if (!timeText && /\d{1,2}:\d{2}\s*(AM|PM)/i.test(t)) timeText = t;
        });

        if (!venueName || !timeText) return;

        const startTime = this.parseTimeText(timeText);
        if (
          !startTime ||
          isNaN(startTime.getTime()) ||
          startTime.getTime() < now
        )
          return;

        // Price from the bold text at bottom right
        const priceText = $card.find('.font-bold').last().text().trim();
        const priceMatch = priceText.match(/£(\d+(?:\.\d+)?)/);
        const price = priceMatch
          ? Math.round(parseFloat(priceMatch[1]) * 100)
          : 0;

        // Format from badge text (e.g. "5v5", "7v7", "8v8")
        const badges = [];
        $card.find('span').each((_, badge) => {
          badges.push($(badge).text().trim().toLowerCase());
        });
        const formatBadge = badges.find((b) => /^\d+v\d+$/.test(b));
        const format = formatBadge || 'Football';

        // Game ID from URL
        const idMatch = href.match(/\/(\d+)-/);
        const gameId = idMatch ? idMatch[1] : href.split('/').pop();

        // Venue slug from URL (after the ID)
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

    return games;
  }

  /**
   * Parse relative time strings like "5:00 PM, Today", "7:30 PM, Tomorrow",
   * "8:00 PM, Wed 2 Apr"
   */
  parseTimeText(text) {
    if (!text) return null;

    const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return null;

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();

    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    // Build a UK date string and let the Intl API handle timezone
    const lower = text.toLowerCase();
    let dateStr;

    // Get today's date in UK timezone using Intl
    const ukFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    if (lower.includes('today')) {
      dateStr = ukFormatter.format(new Date());
    } else if (lower.includes('tomorrow')) {
      dateStr = ukFormatter.format(new Date(Date.now() + 86400000));
    } else {
      const dateMatch = text.match(
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
      );
      if (!dateMatch) return null;

      const day = parseInt(dateMatch[1], 10);
      const monthNames = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ];
      const month = monthNames.indexOf(dateMatch[2].toLowerCase());
      if (month === -1) return null;

      const year = new Date().getFullYear();
      dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Parse as UK local time using Intl timezone offset
    // Create a date in UTC, then find what UTC time corresponds to this UK local time
    const utcGuess = new Date(
      `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`
    );

    // Get the UK offset at this point in time (handles BST/GMT)
    const ukParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(utcGuess);
    const ukHour = parseInt(
      ukParts.find((p) => p.type === 'hour')?.value || '0',
      10
    );
    const utcHour = utcGuess.getUTCHours();
    const offsetHours = ukHour - utcHour;

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
