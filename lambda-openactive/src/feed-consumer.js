/**
 * RPDE feed consumer with cursor state management.
 * Resumes from last saved cursor, processes new/updated/deleted items incrementally.
 */

const https = require('https');
const { URL } = require('url');
const { getCursor, saveCursor } = require('./supabase');

/**
 * Poll an RPDE feed from the saved cursor position.
 * Returns all new/updated items since last poll. Saves cursor after each page.
 *
 * @param {string} feedUrl - The base feed URL (without cursor params)
 * @param {object} options - { maxPages, timeoutMs }
 * @returns {Promise<{ updated: Array, deleted: Array }>}
 */
async function pollFeed(feedUrl, options = {}) {
  const maxPages = options.maxPages || 200;
  const timeoutMs = options.timeoutMs || 60000;

  // Resume from saved cursor or start from beginning
  let currentUrl = (await getCursor(feedUrl)) || feedUrl;
  const startTime = Date.now();
  let pageCount = 0;
  let lastNext = currentUrl;

  const updated = [];
  const deleted = [];

  while (pageCount < maxPages) {
    if (Date.now() - startTime > timeoutMs) {
      console.warn(
        `Feed timeout after ${pageCount} pages (${updated.length} updated, ${deleted.length} deleted): ${feedUrl}`
      );
      // Save cursor on timeout so we can resume next run
      await saveCursor(feedUrl, lastNext);
      break;
    }

    const response = await fetchPage(currentUrl);
    if (!response) break;

    const { items, next } = response;

    for (const item of items) {
      if (item.state === 'updated' && item.data) {
        updated.push(item);
      } else if (item.state === 'deleted') {
        deleted.push(item.id);
      }
    }

    pageCount++;

    // Feed exhausted: empty items or next points to self
    if (items.length === 0 || next === currentUrl) {
      // Save final cursor position
      await saveCursor(feedUrl, next || currentUrl);
      break;
    }

    // Track cursor position in memory — only saved to DB on completion or timeout
    lastNext = next;
    currentUrl = next;
  }

  if (pageCount > 0) {
    console.log(
      `📡 ${feedUrl.split('/')[2].split('.')[0]}: ${pageCount} pages, ${updated.length} updated, ${deleted.length} deleted`
    );
  }

  return { updated, deleted };
}

/**
 * Fetch a single RPDE page
 */
function fetchPage(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);

    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; PLAYScanner/1.0; +https://playbacksports.ai)',
          Accept: 'application/json',
        },
        timeout: 10000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              // Strip control characters that some feeds contain
              const clean = data.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
              const parsed = JSON.parse(clean);
              resolve({
                items: parsed.items || [],
                next: parsed.next || url,
              });
            } catch (e) {
              console.warn(`JSON parse error: ${e.message}`);
              resolve(null);
            }
          } else if (res.statusCode === 429) {
            console.warn(`Rate limited (429) on ${urlObj.hostname}`);
            resolve(null);
          } else {
            console.warn(`HTTP ${res.statusCode} from ${urlObj.hostname}`);
            resolve(null);
          }
        });
      }
    );

    req.on('error', (e) => {
      console.warn(`Request error: ${e.message}`);
      resolve(null);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

module.exports = { pollFeed };
