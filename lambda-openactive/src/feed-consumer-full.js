/**
 * Simple RPDE full-crawl (no cursor state).
 * Used for small feeds like FacilityUse where we always want the complete dataset.
 */

const https = require('https');
const { URL } = require('url');

async function crawlFeed(feedUrl, options = {}) {
  const maxPages = options.maxPages || 20;
  const timeoutMs = options.timeoutMs || 15000;

  const allItems = [];
  let currentUrl = feedUrl;
  let pageCount = 0;
  const startTime = Date.now();

  while (pageCount < maxPages) {
    if (Date.now() - startTime > timeoutMs) break;

    const response = await fetchPage(currentUrl);
    if (!response) break;

    for (const item of response.items) {
      if (item.state === 'updated' && item.data) {
        allItems.push(item);
      }
    }

    pageCount++;
    if (response.items.length === 0 || response.next === currentUrl) break;
    currentUrl = response.next;
  }

  return allItems;
}

function fetchPage(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 10000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const clean = data.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
              const parsed = JSON.parse(clean);
              resolve({ items: parsed.items || [], next: parsed.next || url });
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

module.exports = { crawlFeed };
