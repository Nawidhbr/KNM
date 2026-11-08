import { SITE, absoluteUrl } from "../config/site";

/** schema.org data for search engines. Ids use the canonical URL. */
export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: absoluteUrl(x.path) })),
});

export const course = (o: { name: string; description: string; path: string; locale: string }) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": absoluteUrl(o.path),
  name: o.name,
  description: o.description,
  inLanguage: o.locale,
  url: absoluteUrl(o.path),
  provider: { "@type": "Organization", name: SITE.name, url: absoluteUrl("/") },
});

export const article = (o: { title: string; description: string; path: string; locale: string; date: string }) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": absoluteUrl(o.path),
  headline: o.title,
  description: o.description,
  inLanguage: o.locale,
  dateModified: o.date,
  url: absoluteUrl(o.path),
  publisher: { "@type": "Organization", name: SITE.name, url: absoluteUrl("/") },
});

export const website = (locale: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: absoluteUrl(`/${locale}/`),
  inLanguage: locale,
});
