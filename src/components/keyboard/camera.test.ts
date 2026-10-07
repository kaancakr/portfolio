import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAMERA_ELEVATION_DEG,
  CAMERA_FOV,
  CAMERA_LOOK_AT,
  CAMERA_PARALLAX,
  KEYBOARD_EXTENT,
  PANEL_ELEVATION_DEG,
  caseCorners,
  cameraPosition,
  fitCameraDistance,
  projectToNdc,
  visibleWidthAt,
} from "./camera.ts";

const base = { fovDeg: CAMERA_FOV, elevationDeg: CAMERA_ELEVATION_DEG, ...KEYBOARD_EXTENT };
const PARALLAX_OFFSETS = [
  [0, 0],
  [CAMERA_PARALLAX.x, CAMERA_PARALLAX.y],
  [-CAMERA_PARALLAX.x, -CAMERA_PARALLAX.y],
  [CAMERA_PARALLAX.x, -CAMERA_PARALLAX.y],
  [-CAMERA_PARALLAX.x, CAMERA_PARALLAX.y],
];

/** Largest |x| and |y| (in NDC) any keyboard corner reaches across the parallax extremes. */
function projectedExtremes(aspect: number, elevationDeg: number) {
  const distance = fitCameraDistance({ ...base, aspect, elevationDeg });
  let maxX = 0;
  let maxY = 0;
  for (const [offsetX, offsetY] of PARALLAX_OFFSETS) {
    const eye = cameraPosition({ distance, elevationDeg, offsetX, offsetY });
    for (const corner of caseCorners()) {
      const p = projectToNdc(corner, eye, CAMERA_FOV, aspect);
      maxX = Math.max(maxX, Math.abs(p.x));
      maxY = Math.max(maxY, Math.abs(p.y));
    }
  }
  return { maxX, maxY };
}

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
  const { maxX, maxY } = projectedExtremes(3, CAMERA_ELEVATION_DEG);
  assert.ok(maxY > 0.999 && maxY <= 1 + 1e-9, `maxY ${maxY}`);
  assert.ok(maxX < 0.9, `maxX ${maxX}`);
});

test("throws_for_non_positive_aspect", () => {
  for (const aspect of [0, -1, Number.NaN]) {
    assert.throws(() => fitCameraDistance({ ...base, aspect }), RangeError, String(aspect));
  }
});

test("look_at_point_projects_to_the_frame_center", () => {
  const eye = cameraPosition({ distance: 20, elevationDeg: CAMERA_ELEVATION_DEG, offsetX: 0, offsetY: 0 });
  const p = projectToNdc(CAMERA_LOOK_AT, eye, CAMERA_FOV, 1.5);
  assert.ok(Math.abs(p.x) < 1e-9 && Math.abs(p.y) < 1e-9);
});

test("camera_sits_above_and_in_front_of_the_look_at_point", () => {
  const eye = cameraPosition({ distance: 10, elevationDeg: 90, offsetX: 0, offsetY: 0 });
  assert.ok(Math.abs(eye.x - CAMERA_LOOK_AT.x) < 1e-9);
  assert.ok(Math.abs(eye.y - (CAMERA_LOOK_AT.y + 10)) < 1e-9);
  assert.ok(Math.abs(eye.z - CAMERA_LOOK_AT.z) < 1e-9);
});

test("point_at_the_horizontal_fov_edge_projects_to_x_1", () => {
  const aspect = 2;
  const eye = { x: 0, y: 0, z: 10 };
  const halfWidth = 10 * Math.tan((CAMERA_FOV / 2) * (Math.PI / 180)) * aspect;
  const p = projectToNdc({ x: halfWidth, y: 0, z: 0 }, eye, CAMERA_FOV, aspect, { x: 0, y: 0, z: 0 });
  assert.ok(Math.abs(p.x - 1) < 1e-9 && Math.abs(p.y) < 1e-9);
});

test("keeps_every_case_corner_in_frame_at_any_aspect_and_parallax", () => {
  const aspects = [375 / 560, 0.75, 1, 1.33, 1.6, 1.94, 2.27, 2.37, 2.6, 3.2];
  for (const aspect of aspects) {
    for (const elevationDeg of [CAMERA_ELEVATION_DEG, PANEL_ELEVATION_DEG]) {
      const { maxX, maxY } = projectedExtremes(aspect, elevationDeg);
      assert.ok(
        maxX <= 1 + 1e-9 && maxY <= 1 + 1e-9,
        `aspect ${aspect.toFixed(2)}, elevation ${elevationDeg}: corner reaches ndc ${maxX.toFixed(3)},${maxY.toFixed(3)}`,
      );
    }
  }
});
