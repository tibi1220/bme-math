import { basePath } from '@/lib/base-path';

// Where the site is published. The canonical URLs of the pages, the sitemap
// (app/sitemap.ts) and robots.txt (app/robots.ts) are built from it.

export const siteName = 'BME Matek';

export const siteOrigin = 'https://tibi1220.github.io';

export const siteDescription =
  'Régi zárthelyi- és vizsgafeladatok kidolgozott megoldásokkal, évek és témakörök szerint, BME-s matektárgyakhoz.';

// The absolute URL of a route, e.g. '/analysis-a1' →
// 'https://tibi1220.github.io/bme-math/analysis-a1/'. Pages are exported as
// <path>/index.html, so their URLs end with a slash.
export function absoluteUrl(path: string) {
  return `${siteOrigin}${basePath}${path.endsWith('/') ? path : `${path}/`}`;
}
