#!/usr/bin/env node
/**
 * Hireapitch venue-slug discovery.
 *
 * Hireapitch's public venue URLs use marketing-friendly area slugs
 * (e.g. "Marylebone-3G", "Kennington", "Canada-Water") that aren't
 * derivable from the venue's <title>. The lambda's hireapitch provider
 * needs a static map from {kebab-cased-title} → {real-slug} to avoid
 * shipping 404 booking links.
 *
 * Run this when launching new venues or every few months to refresh:
 *   node scripts/discover-hireapitch-slugs.mjs \
 *     > lambda-playscanner/src/providers/hireapitch-venues.json
 *
 * Crawls four location filters via headless Chromium (Playwright is
 * picked up from PLAYHUB's installed copy), then visits every venue
 * page to capture the canonical title. Output is a JSON object with
 * sorted keys for clean diffs.
 *
 * Requires Playwright. ~5 minutes runtime for ~250 venues.
 */
import { chromium } from 'playwright';

const FILTERS = ['all', 'london', 'manchester', 'birmingham'];
const VENUE_LINK = /^https:\/\/hireapitch\.com\/[A-Z][A-Za-z0-9-]+$/;

const cleanTitle = (t) =>
  t
    .split('|')[0]
    .replace(/\s*-?\s*hire\s*a\s*pitch\s*$/i, '')
    .trim();

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();

const seen = new Set();
const links = [];
for (const f of FILTERS) {
  await page
    .goto(`https://hireapitch.com/locations?location=${f}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })
    .catch(() => {});
  await page.waitForTimeout(1500);
  const found = await page.$$eval('a', (as) => as.map((a) => a.href));
  for (const h of found) {
    if (VENUE_LINK.test(h) && !seen.has(h)) {
      seen.add(h);
      links.push(h);
    }
  }
  process.stderr.write(
    `location=${f}: ${links.length} cumulative venue links\n`
  );
}

const map = {};
for (const url of links) {
  try {
    const r = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    if (!r || r.status() >= 400) continue;
    const title = await page.title();
    const cleaned = cleanTitle(title);
    if (!cleaned || cleaned.toLowerCase().startsWith('error')) continue;
    const ourSlug = norm(cleaned);
    if (!map[ourSlug]) {
      map[ourSlug] = url.replace('https://hireapitch.com/', '');
    }
  } catch {
    // Skip individual venue failures — first-seen-wins, the rest is best effort
  }
}

await browser.close();

const sorted = Object.fromEntries(Object.entries(map).sort());
process.stderr.write(`\nMapped ${Object.keys(sorted).length} venues\n`);
process.stdout.write(JSON.stringify(sorted, null, 2) + '\n');
