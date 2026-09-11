import { createFileRoute } from "@tanstack/react-router";

import { loadSitemapCategorySlugs } from "@/lib/store.server";


/** Public pages that should always be listed. */
const STATIC_PATHS: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/browse", priority: "0.9", changefreq: "daily" },
  { path: "/shoes", priority: "0.9", changefreq: "weekly" },
  { path: "/mystery-box", priority: "0.8", changefreq: "weekly" },
  { path: "/categories", priority: "0.7", changefreq: "weekly" },
  { path: "/tracking", priority: "0.5", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/affiliate", priority: "0.5", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/accessibility", priority: "0.3", changefreq: "yearly" },
];

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const urls = STATIC_PATHS.map((p) => ({ loc: `${origin}${p.path}`, priority: p.priority, changefreq: p.changefreq }));

        try {
          for (const slug of await loadSitemapCategorySlugs()) {
            urls.push({ loc: `${origin}/category/${encodeURIComponent(slug)}`, priority: "0.6", changefreq: "weekly" });
          }
        } catch (error) {
          // A catalog read failure must not break the sitemap for static pages.
          console.error("sitemap categories failed", error);
        }


        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escape(u.loc)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
