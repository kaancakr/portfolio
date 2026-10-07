import { KEYS, SECTIONS, keyById } from "./layout.ts";
import type { KeyDef, SectionId } from "./layout.ts";

export interface TypingState {
  buffer: string;
}

export interface TypingMatch {
  section: SectionId;
  length: number;
}

export interface TypingResult {
  state: TypingState;
  match: TypingMatch | null;
  open: SectionId | null;
}

export interface KeystrokeInfo {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
  target: { tagName?: string; isContentEditable?: boolean } | null;
}

export const INITIAL_TYPING: TypingState = { buffer: "" };

const WORDS = SECTIONS.map((section) => ({ id: section.id, word: section.word.toLowerCase() }));
const MODIFIER_KEYS = new Set(["Shift", "CapsLock", "Control", "Alt", "Meta"]);
const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function matchFor(buffer: string): TypingMatch | null {
  if (buffer === "") return null;
  const entry = WORDS.find(({ word }) => word.startsWith(buffer));
  return entry ? { section: entry.id, length: buffer.length } : null;
}

/**
 * The lowercase a–z letter a key types, or null for any other key. A Turkish layout types "İ"
 * for Shift/CapsLock+i and has a dotless "ı" key; both count as "i".
 */
export function typedLetter(key: string): string | null {
  if (key === "İ" || key === "ı") return "i";
  return /^[a-z]$/i.test(key) ? key.toLowerCase() : null;
}

/** Longest suffix of `buffer` that starts some word; "" when none does. */
function longestWordPrefixSuffix(buffer: string): string {
  for (let start = 0; start < buffer.length; start++) {
    const suffix = buffer.slice(start);
    if (WORDS.some(({ word }) => word.startsWith(suffix))) return suffix;
  }
  return "";
}

export function advanceTyping(state: TypingState, key: string): TypingResult {
  if (MODIFIER_KEYS.has(key)) {
    return { state, match: matchFor(state.buffer), open: null };
  }
  if (key === "Backspace") {
    const buffer = state.buffer.slice(0, -1);
    return { state: { buffer }, match: matchFor(buffer), open: null };
  }
  const letter = typedLetter(key);
  if (letter === null) {
    return { state: INITIAL_TYPING, match: null, open: null };
  }

  const buffer = longestWordPrefixSuffix(state.buffer + letter);
  const completed = WORDS.find(({ word }) => word === buffer);
  if (completed) {
    return { state: INITIAL_TYPING, match: { section: completed.id, length: buffer.length }, open: completed.id };
  }
  return { state: { buffer }, match: matchFor(buffer), open: null };
}

export function keyForTypedLetter(letter: string, match: TypingMatch | null): KeyDef | null {
  if (match) return keyById(`${match.section}-${match.length - 1}`) ?? null;
  const legend = letter.toUpperCase();
  return KEYS.find((key) => key.kind === "word" && key.legend === legend) ?? null;
}

export function isNavigationKeystroke(e: KeystrokeInfo): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return false;
  if (e.target && (e.target.isContentEditable || EDITABLE_TAGS.has(e.target.tagName ?? ""))) return false;
  return true;
}
