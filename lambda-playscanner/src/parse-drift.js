/**
 * Selector-drift detector for HTML scrapers.
 *
 * Two providers (Playtomic 2026-07-15, Footy Addicts 2026-07-22) went silent
 * with the same signature: fetch succeeds, parser extracts nothing, run logs
 * as success. The zero-slot health check catches full deadness a day later;
 * this makes the collector log name the likely cause immediately.
 *
 * Call it with the count of a STRUCTURAL anchor selector — an element that
 * must exist on a well-formed page regardless of availability (date-section
 * labels, day columns, facility panels) — never with the slot count, which
 * is legitimately zero all the time.
 */
const MIN_HTML_BYTES = 5000;

function warnSelectorDrift(provider, anchorDescription, html, matchCount) {
  if (matchCount > 0) return false;
  // A tiny or empty body is a fetch/block problem, not selector drift —
  // those paths already surface as HTTP errors.
  if (!html || html.length < MIN_HTML_BYTES) return false;
  console.warn(
    `⚠️ SELECTOR DRIFT? ${provider}: "${anchorDescription}" matched 0 elements ` +
      `in ${html.length}-byte HTML — the site markup likely changed`
  );
  return true;
}

module.exports = { warnSelectorDrift, MIN_HTML_BYTES };
