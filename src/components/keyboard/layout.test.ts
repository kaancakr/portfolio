import { test } from "node:test";
import assert from "node:assert/strict";
import { KEYS, SECTIONS, ROW_UNITS, ROW_COUNT, WORD_START_X, keysForSection, keyById } from "./layout.ts";

test("every_row_sums_to_15_units", () => {
  for (let row = 0; row < ROW_COUNT; row++) {
    const total = KEYS.filter((k) => k.row === row).reduce((sum, k) => sum + k.width, 0);
    assert.equal(total, ROW_UNITS, `row ${row}`);
  }
});

test("each_section_word_is_contiguous_in_order_from_column_1_5", () => {
  for (const section of SECTIONS) {
    const keys = keysForSection(section.id);
    assert.equal(keys.map((k) => k.legend).join(""), section.word);
    keys.forEach((k, i) => {
      assert.equal(k.x, WORD_START_X + i);
      assert.equal(k.width, 1);
      assert.equal(k.index, i);
      assert.equal(k.row, keys[0].row);
    });
  }
});

test("key_ids_are_unique", () => {
  assert.equal(new Set(KEYS.map((k) => k.id)).size, KEYS.length);
});

test("keys_are_listed_in_reading_order", () => {
  for (let i = 1; i < KEYS.length; i++) {
    const [a, b] = [KEYS[i - 1], KEYS[i]];
    assert.ok(a.row < b.row || (a.row === b.row && a.x < b.x), `${a.id} before ${b.id}`);
  }
});

test("action_keys_end_rows_0_to_2", () => {
  for (const [id, row] of [["cv", 0], ["github", 1], ["mail", 2]] as const) {
    const key = keyById(id)!;
    assert.deepEqual([key.kind, key.action, key.row, key.width, key.x + key.width], ["action", id, row, 2.5, 15]);
  }
});

test("space_bar_carries_owner_name", () => {
  const space = keyById("space")!;
  assert.deepEqual([space.legend, space.width, space.row, space.kind], ["KAAN ÇAKIR", 9, 4, "modifier"]);
});
