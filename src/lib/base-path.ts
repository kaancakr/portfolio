// Next inlines its configured basePath here at build time ("" in `next dev`). It is an internal name, but it is
// the same value that prefixes /_next/ URLs, and the Pages workflow injects basePath into a generated
// next.config.js that overrides next.config.ts, so a NEXT_PUBLIC_ variable set there would never reach CI.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? "";

/** Prefixes a root-relative public/ asset path with the deploy basePath, e.g. withBasePath("/projects/abu-app.png"). */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
