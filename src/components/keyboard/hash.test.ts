import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSectionHash, sectionHash } from "./hash.ts";

test("parses_known_section_hash", () => assert.equal(parseSectionHash("#experience"), "experience"));

test("is_case_insensitive", () => assert.equal(parseSectionHash("#Projects"), "projects"));

test("rejects_empty_unknown_and_malformed_hashes", () => {
  for (const hash of ["", "#", "#unknown", "#about/extra", "about", "#about "]) {
    assert.equal(parseSectionHash(hash), null, hash);
  }
});

test("builds_hash_for_section", () => assert.equal(sectionHash("contact"), "#contact"));
