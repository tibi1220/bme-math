// The basePath from next.config.ts ('' locally, '/bme-math' on GitHub Pages).
// next/link adds it by itself; URLs of static files under public/ and fetch
// calls need it added by hand.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function withBasePath(path: string) {
  return `${basePath}${path}`;
}
