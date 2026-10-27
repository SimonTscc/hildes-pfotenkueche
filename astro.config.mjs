// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Vorschau auf GitHub Pages unter /hildes-pfotenkueche/. Bei eigener Domain: site anpassen, base auf '/'.
export default defineConfig({
  site: 'https://simontscc.github.io',
  base: '/hildes-pfotenkueche',
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !/\/(impressum|datenschutz)\/?$/.test(page) })],
  devToolbar: { enabled: false },
});
