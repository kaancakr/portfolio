import { withBasePath } from "../../lib/base-path.ts";

export type SectionId = "about" | "experience" | "projects" | "contact";
export type ActionId = "cv" | "github" | "mail";
export type KeyKind = "word" | "action" | "modifier" | "blank";

export interface KeyDef {
  id: string;
  kind: KeyKind;
  legend: string;
  width: number;
  row: number;
  /** Left edge of the key, in units from the start of its row. */
  x: number;
  section?: SectionId;
  index?: number;
  action?: ActionId;
}

export const SECTIONS: readonly { id: SectionId; word: string; label: string }[] = [
  { id: "about", word: "ABOUT", label: "About" },
  { id: "experience", word: "EXPERIENCE", label: "Experience" },
  { id: "projects", word: "PROJECTS", label: "Projects" },
  { id: "contact", word: "CONTACT", label: "Contact" },
];

export const ACTIONS: Record<ActionId, { label: string; href: string; download?: true; external?: true }> = {
  cv: { label: "CV", href: withBasePath("/Eren_Kaan_Cakir_Resume.pdf"), download: true },
  github: { label: "GitHub", href: "https://github.com/kaancakr", external: true },
  mail: { label: "Mail", href: "mailto:erenkaancakr@gmail.com" },
};

export const ROW_UNITS = 15;
export const ROW_COUNT = 5;
export const WORD_START_X = 1.5;

type KeySpec =
  | { modifier: string; legend: string; width: number }
  | { word: SectionId }
  | { blanks: number }
  | { action: ActionId; legend: string };

const ROW_SPECS: KeySpec[][] = [
  [{ modifier: "esc", legend: "Esc", width: 1.5 }, { word: "about" }, { blanks: 6 }, { action: "cv", legend: "CV ↓" }],
  [{ modifier: "tab", legend: "Tab", width: 1.5 }, { word: "experience" }, { blanks: 1 }, { action: "github", legend: "GitHub" }],
  [{ modifier: "caps", legend: "Caps", width: 1.5 }, { word: "projects" }, { blanks: 3 }, { action: "mail", legend: "Mail" }],
  [
    { modifier: "lshift", legend: "Shift", width: 1.5 },
    { word: "contact" },
    { blanks: 3 },
    { modifier: "rshift", legend: "Shift", width: 3.5 },
  ],
  [
    { modifier: "lctrl", legend: "Ctrl", width: 1.5 },
    { modifier: "lalt", legend: "Alt", width: 1.25 },
    { modifier: "space", legend: "KAAN ÇAKIR", width: 9 },
    { modifier: "ralt", legend: "Alt", width: 1.25 },
    { modifier: "fn", legend: "Fn", width: 2 },
  ],
];

const ACTION_KEY_WIDTH = 2.5;

function buildKeys(): KeyDef[] {
  const keys: KeyDef[] = [];
  ROW_SPECS.forEach((specs, row) => {
    // x accumulates from widths so key positions can never drift from the row spec.
    let x = 0;
    let blankCount = 0;
    const push = (key: Omit<KeyDef, "row" | "x">) => {
      keys.push({ ...key, row, x });
      x += key.width;
    };
    for (const spec of specs) {
      if ("modifier" in spec) {
        push({ id: spec.modifier, kind: "modifier", legend: spec.legend, width: spec.width });
      } else if ("word" in spec) {
        const word = SECTIONS.find((s) => s.id === spec.word)!.word;
        [...word].forEach((letter, index) =>
          push({ id: `${spec.word}-${index}`, kind: "word", legend: letter, width: 1, section: spec.word, index }),
        );
      } else if ("blanks" in spec) {
        for (let n = 0; n < spec.blanks; n++) {
          push({ id: `blank-${row}-${blankCount++}`, kind: "blank", legend: "", width: 1 });
        }
      } else {
        push({ id: spec.action, kind: "action", legend: spec.legend, width: ACTION_KEY_WIDTH, action: spec.action });
      }
    }
  });
  return keys;
}

export const KEYS: readonly KeyDef[] = buildKeys();

export function keysForSection(id: SectionId): KeyDef[] {
  return KEYS.filter((key) => key.section === id);
}

export function keyById(id: string): KeyDef | undefined {
  return KEYS.find((key) => key.id === id);
}
