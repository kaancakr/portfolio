import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAMERA_FOV,
  CAMERA_LOOK_AT,
  CAMERA_PARALLAX,
  DESK_FILL,
  KEYBOARD_EXTENT,
  MAX_SCREEN_PX,
  MIN_SCREEN_PX,
  PANEL_ELEVATION_DEG,
  SCREEN_FILL,
  caseCorners,
  cameraPosition,
  deskPose,
  fitCameraDistance,
  projectToNdc,
  screenPose,
  screenResolution,
  visibleWidthAt,
} from "./camera.ts";
import type { Vec3, ViewPose } from "./camera.ts";
import { monitorCorners, screenCorners } from "./monitor.ts";

const base = { fovDeg: CAMERA_FOV, elevationDeg: PANEL_ELEVATION_DEG, ...KEYBOARD_EXTENT };
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
  const { maxX, maxY } = projectedExtremes(3, PANEL_ELEVATION_DEG);
  assert.ok(maxY > 0.999 && maxY <= 1 + 1e-9, `maxY ${maxY}`);
  assert.ok(maxX < 0.9, `maxX ${maxX}`);
});

test("throws_for_non_positive_aspect", () => {
  for (const aspect of [0, -1, Number.NaN]) {
    assert.throws(() => fitCameraDistance({ ...base, aspect }), RangeError, String(aspect));
  }
});

test("look_at_point_projects_to_the_frame_center", () => {
  const eye = cameraPosition({ distance: 20, elevationDeg: PANEL_ELEVATION_DEG, offsetX: 0, offsetY: 0 });
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
    const { maxX, maxY } = projectedExtremes(aspect, PANEL_ELEVATION_DEG);
    assert.ok(
      maxX <= 1 + 1e-9 && maxY <= 1 + 1e-9,
      `aspect ${aspect.toFixed(2)}: corner reaches ndc ${maxX.toFixed(3)},${maxY.toFixed(3)}`,
    );
  }
});

const ASPECTS = [375 / 560, 0.75, 1, 1.33, 1.6, 1.94, 2.27, 2.6, 3.2];
const LANDSCAPE_ASPECTS = [1.33, 1.6, 1.94, 2.27, 2.6];

/** Eye positions a pose can take: the pose itself, plus each parallax extreme when it uses parallax. */
function eyesFor(pose: ViewPose, parallax: { x: number; y: number }): Vec3[] {
  return PARALLAX_OFFSETS.map(([sx, sy]) =>
    cameraPosition(
      {
        distance: pose.distance,
        elevationDeg: pose.elevationDeg,
        offsetX: Math.sign(sx) * parallax.x,
        offsetY: Math.sign(sy) * parallax.y,
      },
      pose.lookAt,
    ),
  );
}

function project(corners: Vec3[], eye: Vec3, pose: ViewPose, aspect: number) {
  return corners.map((corner) => projectToNdc(corner, eye, CAMERA_FOV, aspect, pose.lookAt));
}

test("desk_pose_keeps_keyboard_and_monitor_within_desk_fill_at_any_aspect_and_parallax", () => {
  for (const aspect of ASPECTS) {
    const pose = deskPose(aspect);
    for (const eye of eyesFor(pose, CAMERA_PARALLAX)) {
      for (const p of project([...caseCorners(), ...monitorCorners()], eye, pose, aspect)) {
        assert.ok(
          Math.abs(p.x) <= DESK_FILL + 1e-9 && Math.abs(p.y) <= DESK_FILL + 1e-9,
          `aspect ${aspect.toFixed(2)}: ndc ${p.x},${p.y}`,
        );
      }
    }
  }
});

// The desktop DOM is drawn over the canvas, so it would cover any part of the keyboard behind it.
test("keyboard_stays_below_the_screen_in_desk_and_reading_views", () => {
  for (const aspect of ASPECTS) {
    const views: [ViewPose, { x: number; y: number }][] = [
      [deskPose(aspect), CAMERA_PARALLAX],
      [screenPose(aspect), { x: 0, y: 0 }],
    ];
    for (const [pose, parallax] of views) {
      for (const eye of eyesFor(pose, parallax)) {
        const keyboardTop = Math.max(...project(caseCorners(), eye, pose, aspect).map((p) => p.y));
        const screenBottom = Math.min(...project(screenCorners(), eye, pose, aspect).map((p) => p.y));
        assert.ok(keyboardTop < screenBottom, `aspect ${aspect.toFixed(2)}: keyboard ${keyboardTop} vs screen ${screenBottom}`);
      }
    }
  }
});

test("reading_view_fills_the_frame_up_to_screen_fill", () => {
  for (const aspect of ASPECTS) {
    const pose = screenPose(aspect);
    const [eye] = eyesFor(pose, { x: 0, y: 0 });
    const reach = Math.max(...project(screenCorners(), eye, pose, aspect).flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]));
    assert.ok(Math.abs(reach - SCREEN_FILL) < 1e-6, `aspect ${aspect.toFixed(2)}: screen reaches ${reach}`);
  }
});

test("reading_view_shows_the_keyboard_back_edge_under_the_screen_on_landscape", () => {
  for (const aspect of LANDSCAPE_ASPECTS) {
    const pose = screenPose(aspect);
    const [eye] = eyesFor(pose, { x: 0, y: 0 });
    const keyboardTop = Math.max(...project(caseCorners(), eye, pose, aspect).map((p) => p.y));
    assert.ok(keyboardTop > -1, `aspect ${aspect.toFixed(2)}: keyboard top at ${keyboardTop}`);
  }
});

test("screen_resolution_matches_the_reading_view_width", () => {
  const { width, height } = screenResolution(1440, 780);
  const pose = screenPose(1440 / 780);
  const [eye] = eyesFor(pose, { x: 0, y: 0 });
  const xs = project(screenCorners(), eye, pose, 1440 / 780).map((p) => p.x);
  const drawn = ((Math.max(...xs) - Math.min(...xs)) / 2) * 1440;
  assert.ok(Math.abs(width - drawn) <= 0.5, `${width} vs ${drawn}`);
  assert.equal(height, Math.round((width * 10) / 16));
});

test("screen_resolution_is_clamped_to_readable_bounds", () => {
  assert.equal(screenResolution(390, 700).width, MIN_SCREEN_PX);
  assert.equal(screenResolution(5120, 2880).width, MAX_SCREEN_PX);
});

test("screen_resolution_throws_for_an_empty_canvas", () => {
  assert.throws(() => screenResolution(0, 600), RangeError);
  assert.throws(() => screenResolution(800, 0), RangeError);
});
