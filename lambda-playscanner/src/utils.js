/**
 * Shared utilities for PLAYScanner providers
 */

/**
 * Get UK timezone offset for a date (handles GMT/BST transitions correctly).
 * Uses Intl.DateTimeFormat for accurate timezone resolution.
 */
function getUKOffset(dateStr) {
  try {
    // Use Intl API for accurate timezone — handles DST transitions at 1am
    const dt = new Date(`${dateStr}T12:00:00Z`);
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(dt);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart) {
      // "GMT" or "GMT+1"
      if (tzPart.value === 'GMT' || tzPart.value === 'GMT+0') return '+00:00';
      const match = tzPart.value.match(/GMT([+-]\d+)/);
      if (match) {
        const hours = parseInt(match[1], 10);
        return `${hours >= 0 ? '+' : '-'}${String(Math.abs(hours)).padStart(2, '0')}:00`;
      }
    }
  } catch {
    // Fallback to manual calculation
  }

  // Fallback: approximate (same logic as before but documents the limitation)
  const d = new Date(dateStr + 'T12:00:00Z');
  const month = d.getUTCMonth();
  if (month > 2 && month < 9) return '+01:00';
  if (month < 2 || month > 9) return '+00:00';
  const lastDay = new Date(
    Date.UTC(d.getUTCFullYear(), month + 1, 0)
  ).getUTCDate();
  const lastDayOfWeek = new Date(
    Date.UTC(d.getUTCFullYear(), month, lastDay)
  ).getUTCDay();
  const lastSunday = lastDay - lastDayOfWeek;
  if (month === 2) return d.getUTCDate() >= lastSunday ? '+01:00' : '+00:00';
  return d.getUTCDate() < lastSunday ? '+01:00' : '+00:00';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { getUKOffset, sleep };
