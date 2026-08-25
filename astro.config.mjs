// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nexusseries.org',
  // English is served from the root so the existing URLs keep working.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'ru'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    icon({ iconDir: 'src/icons' }),
    // Emits sitemap-index.xml with reciprocal hreflang entries per locale.
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es', ru: 'ru' } },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
