import type { APIRoute } from "astro";

// Wirkt erst mit eigener Domain (base '/'): Suchmaschinen lesen robots.txt nur im Wurzelverzeichnis.
// Gesperrt wird hier nichts; die Vorschau hält noindex im Seitenkopf aus dem Index.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/sitemap-index.xml`, site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
