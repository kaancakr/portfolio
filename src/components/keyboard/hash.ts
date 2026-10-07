import { SECTIONS } from "./layout.ts";
import type { SectionId } from "./layout.ts";

export function parseSectionHash(hash: string): SectionId | null {
  if (!hash.startsWith("#")) return null;
  const candidate = hash.slice(1).toLowerCase();
  return SECTIONS.find((section) => section.id === candidate)?.id ?? null;
}

export function sectionHash(id: SectionId): string {
  return `#${id}`;
}
