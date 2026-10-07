import { test } from "node:test";
import assert from "node:assert/strict";
import { CAMERA_FOV, KEYBOARD_EXTENT, fitCameraDistance, visibleWidthAt } from "./camera.ts";

const base = { fovDeg: CAMERA_FOV, ...KEYBOARD_EXTENT };

test("fits_full_width_at_phone_portrait", () => {
  const aspect = 375 / 560;
  const d = fitCameraDistance({ ...base, aspect });
  assert.ok(visibleWidthAt(d, CAMERA_FOV, aspect) >= base.width + 2 * base.margin - 1e-9);
});

test("distance_grows_as_viewport_narrows", () => {
  const [narrow, square, wide] = [0.6, 1.0, 1.6].map((aspect) => fitCameraDistance({ ...base, aspect }));
  assert.ok(narrow > square && square > wide);
});

test("fits_full_width_at_2560x1080", () => {
  const aspect = 2560 / 1080;
  const d = fitCameraDistance({ ...base, aspect });
  assert.ok(visibleWidthAt(d, CAMERA_FOV, aspect) >= base.width + 2 * base.margin - 1e-9);
});

test("very_wide_viewport_is_limited_by_depth", () => {
  const expected = (base.depth / 2 + base.margin) / Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
  assert.ok(Math.abs(fitCameraDistance({ ...base, aspect: 3 }) - expected) < 1e-9);
});

test("throws_for_non_positive_aspect", () => {
  for (const aspect of [0, -1, Number.NaN]) {
    assert.throws(() => fitCameraDistance({ ...base, aspect }), RangeError, String(aspect));
  }
});
