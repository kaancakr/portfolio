import { test } from "node:test";
import assert from "node:assert/strict";
import { INITIAL_TYPING, advanceTyping, keyForTypedLetter, isNavigationKeystroke } from "./typing.ts";
import type { KeystrokeInfo, TypingResult } from "./typing.ts";

const typeText = (text: string, start = INITIAL_TYPING) => {
  let result: TypingResult = { state: start, match: null, open: null };
  for (const ch of text) result = advanceTyping(result.state, ch);
  return result;
};

test("matches_word_prefix", () => assert.deepEqual(typeText("abo").match, { section: "about", length: 3 }));

test("keeps_longest_suffix_after_stray_letters", () => {
  assert.deepEqual(typeText("xab").match, { section: "about", length: 2 });
});

test("falls_back_to_shorter_suffix_that_starts_another_word", () => {
  assert.deepEqual(typeText("proc").match, { section: "contact", length: 1 });
});

test("opens_section_and_resets_buffer_when_word_completes", () => {
  const r = typeText("about");
  assert.equal(r.open, "about");
  assert.equal(r.state.buffer, "");
  assert.deepEqual(r.match, { section: "about", length: 5 });
});

test("opens_after_leading_noise", () => assert.equal(typeText("zzexperience").open, "experience"));

test("is_case_insensitive", () => assert.equal(typeText("PROJECTS").open, "projects"));

test("clears_match_when_letter_breaks_every_prefix", () => {
  const r = typeText("exz");
  assert.equal(r.match, null);
  assert.equal(r.state.buffer, "");
});

test("backspace_removes_last_letter", () => {
  assert.deepEqual(advanceTyping(typeText("abo").state, "Backspace").match, { section: "about", length: 2 });
});

test("backspace_on_empty_buffer_stays_empty", () => {
  assert.deepEqual(advanceTyping(INITIAL_TYPING, "Backspace"), { state: { buffer: "" }, match: null, open: null });
});

test("modifier_keys_leave_buffer_unchanged", () => {
  for (const key of ["Shift", "CapsLock", "Control", "Alt", "Meta"]) {
    assert.deepEqual(advanceTyping(typeText("ab").state, key).match, { section: "about", length: 2 }, key);
  }
});

test("other_keys_reset_buffer", () => {
  for (const key of [" ", "1", "Enter", "ArrowLeft"]) {
    assert.equal(advanceTyping(typeText("ab").state, key).state.buffer, "", key);
  }
});

test("typed_letter_presses_key_of_current_match", () => {
  assert.equal(keyForTypedLetter("p", { section: "experience", length: 3 })?.id, "experience-2");
});

test("unmatched_letter_presses_first_key_in_reading_order", () => {
  assert.equal(keyForTypedLetter("t", null)?.id, "about-4");
});

test("letter_missing_from_keyboard_presses_nothing", () => assert.equal(keyForTypedLetter("q", null), null));

const stroke = (over: Partial<KeystrokeInfo>): KeystrokeInfo => ({
  key: "a",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  repeat: false,
  target: { tagName: "BODY" },
  ...over,
});

test("plain_letter_is_navigation", () => assert.equal(isNavigationKeystroke(stroke({})), true));

test("shortcut_combos_are_ignored", () => {
  for (const over of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
    assert.equal(isNavigationKeystroke(stroke(over)), false, JSON.stringify(over));
  }
});

test("auto_repeat_is_ignored", () => assert.equal(isNavigationKeystroke(stroke({ repeat: true })), false));

test("editable_targets_are_ignored", () => {
  const targets = [{ tagName: "INPUT" }, { tagName: "TEXTAREA" }, { tagName: "SELECT" }, { tagName: "DIV", isContentEditable: true }];
  for (const target of targets) {
    assert.equal(isNavigationKeystroke(stroke({ target })), false, JSON.stringify(target));
  }
});
