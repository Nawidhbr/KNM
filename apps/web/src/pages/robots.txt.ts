import type { APIRoute } from "astro";
import { INDEXING, absoluteUrl } from "../config/site";

/**
 * Crawling is always allowed: a page must be fetched for its noindex tag to be
 * seen. Whether pages may be indexed is decided by the robots meta tag.
 */
export const GET: APIRoute = () => {
  const lines = ["User-agent: *", "Allow: /"];
  if (INDEXING) lines.push("", `Sitemap: ${absoluteUrl("/sitemap-index.xml")}`);
  return new Response(`${lines.join("\n")}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
