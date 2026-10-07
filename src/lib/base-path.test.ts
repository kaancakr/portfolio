import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const PUBLIC_DIR = join(ROOT, "public");
const SRC_DIR = join(ROOT, "src");

function listFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[]).filter((path) => statSync(join(dir, path)).isFile());
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GitHub Pages serves public/ under the basePath (/portfolio), so "/projects/abu-app.png" 404s there.
test("public_assets_are_referenced_through_withBasePath", () => {
  const assets = listFiles(PUBLIC_DIR).map((path) => "/" + path.split(sep).join("/"));
  const sources = listFiles(SRC_DIR).filter((path) => /\.tsx?$/.test(path) && !path.endsWith(".test.ts"));
  const offenders: string[] = [];
  for (const path of sources) {
    const source = readFileSync(join(SRC_DIR, path), "utf8");
    for (const asset of assets) {
      if (new RegExp(`(?<!withBasePath\\()["'\`]${escapeRegExp(asset)}["'\`]`).test(source)) {
        offenders.push(`src/${path}: ${asset}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});
