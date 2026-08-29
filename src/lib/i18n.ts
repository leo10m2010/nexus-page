import type { Dictionary, Locale } from "@types";
import { en } from "@content/en";
import { es } from "@content/es";
import { ru } from "@content/ru";

export const DEFAULT_LOCALE: Locale = "en";

export const localeMeta: Record<Locale, { code: string; name: string; htmlLang: string; ogLocale: string; flag: string }> = {
  en: { code: "EN", name: "English", htmlLang: "en", ogLocale: "en_US", flag: "us" },
  es: { code: "ES", name: "Español", htmlLang: "es", ogLocale: "es_ES", flag: "es" },
  ru: { code: "RU", name: "Русский", htmlLang: "ru", ogLocale: "ru_RU", flag: "ru" },
};

export const locales = Object.keys(localeMeta) as Locale[];

const dictionaries: Record<Locale, Dictionary> = { en, es, ru };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as string[]).includes(value);
}

export function useTranslations(locale: string | undefined): Dictionary {
  return dictionaries[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

export function resolveLocale(locale: string | undefined): Locale {
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function localePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}/`;
}

export function localizePath(pathname: string, locale: Locale): string {
  const withoutLocale = pathname.replace(new RegExp(`^/(${locales.join("|")})(?=/|$)`), "");
  return `${localePath(locale)}${withoutLocale.replace(/^\//, "")}`;
}
