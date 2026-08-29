import { localeMeta, resolveLocale } from "@lib/i18n";

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

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatMoney(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
