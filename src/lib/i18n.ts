import type { Dictionary, Locale } from "@types";
import { en } from "@content/en";
import { es } from "@content/es";
import { ru } from "@content/ru";

export const DEFAULT_LOCALE: Locale = "en";

/** Display metadata for the switcher. `name` is written in its own language. */
export const localeMeta: Record<Locale, { code: string; name: string; htmlLang: string; ogLocale: string }> = {
  en: { code: "EN", name: "English", htmlLang: "en", ogLocale: "en_US" },
  es: { code: "ES", name: "Español", htmlLang: "es", ogLocale: "es_ES" },
  ru: { code: "RU", name: "Русский", htmlLang: "ru", ogLocale: "ru_RU" },
};

export const locales = Object.keys(localeMeta) as Locale[];

const dictionaries: Record<Locale, Dictionary> = { en, es, ru };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as string[]).includes(value);
}

/** Falls back to the default rather than throwing, so a bad segment still renders. */
export function useTranslations(locale: string | undefined): Dictionary {
  return dictionaries[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

export function resolveLocale(locale: string | undefined): Locale {
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

/** The default locale is served from the root, the others from a prefix. */
export function localePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}/`;
}
