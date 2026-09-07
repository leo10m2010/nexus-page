import { localeMeta, resolveLocale } from "@lib/i18n";

const ZONE = "UTC";

function tag(locale: string | undefined): string {
  return localeMeta[resolveLocale(locale)].htmlLang;
}

export function formatDay(date: Date, locale?: string, timeZone = ZONE): string {
  return new Intl.DateTimeFormat(tag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(date);
}

export function formatDate(date: Date, locale?: string, timeZone = ZONE): string {
  return new Intl.DateTimeFormat(tag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);
}

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

export function dayKey(date: Date, timeZone = ZONE): string {
  if (timeZone === "UTC") return date.toISOString().slice(0, 10);
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getBroadcastTimes(date: Date, locale?: string): {
  pet: { time: string; date: string };
  europe: { time: string; date: string; zone: string };
} {
  const localized = tag(locale);
  const times = ["America/Lima", "Europe/Berlin"].map((timeZone) => ({
    time: new Intl.DateTimeFormat(localized, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).format(date),
    date: new Intl.DateTimeFormat(localized, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    }).format(date),
  }));
  // Use a fixed locale for the abbreviation, not the translated zone name.
  const zone = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    timeZoneName: "short",
  }).formatToParts(date).find((part) => part.type === "timeZoneName")!.value;

  return { pet: times[0]!, europe: { ...times[1]!, zone } };
}

export function formatMoney(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
