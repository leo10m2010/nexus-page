import { localeMeta, resolveLocale } from "@lib/i18n";

/**
 * Every competition date is formatted in UTC.
 *
 * Two reasons. Date-only values like a tournament's startDate parse as UTC
 * midnight, so formatting them in the build machine's zone silently shifts
 * them a day back. And the page is static HTML: a "local time" rendered at
 * build time is the builder's local time, not the reader's, which would be a
 * lie. UTC is unambiguous and it is what tournament schedules publish.
 */
const ZONE = "UTC";

function tag(locale: string | undefined): string {
  return localeMeta[resolveLocale(locale)].htmlLang;
}

export function formatDay(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(tag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: ZONE,
  }).format(date);
}

export function formatDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(tag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: ZONE,
  }).format(date);
}

/**
 * A run of dates. `formatRange` is the only thing that gets this right in
 * every locale: English puts the month first ("Aug 20 - 30"), Spanish and
 * Russian put the day first ("20-30 ago"). Its default separator is an en
 * dash, which the project does not use, so it is swapped for a hyphen.
 */
export function formatDateRange(start: Date, end: Date, locale?: string): string {
  return new Intl.DateTimeFormat(tag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: ZONE,
  })
    .formatRange(start, end)
    .replace(/\s*[‒-―]\s*/g, " - ");
}

export function formatTime(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(tag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: ZONE,
  }).format(date);
}

/** Stable UTC key for grouping matches into calendar days. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A prize amount. Rendered in the reader's language but always in the
 * tournament's own currency, and without cents: prize pools are round
 * numbers and "$22,000.00" reads like an invoice, not like a prize.
 */
export function formatMoney(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
