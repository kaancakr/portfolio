import { SCREEN_CENTER, SCREEN_SIZE, SCREEN_TILT_DEG, monitorCorners, screenCorners } from "./monitor.ts";

export interface KeyboardExtent {
  width: number;
  depth: number;
  margin: number;
}

export interface FitOptions extends KeyboardExtent {
  aspect: number;
  /** Vertical field of view, in degrees. */
  fovDeg: number;
  /** Camera elevation above the keyboard plane, in degrees. */
  elevationDeg: number;
}

export interface FitCornersOptions {
  corners: Vec3[];
  lookAt: Vec3;
  aspect: number;
  fovDeg: number;
  elevationDeg: number;
  /** Largest pointer-parallax shift the camera can take, in world units. */
  parallax: { x: number; y: number };
  /** Largest |x| and |y| any corner may reach in normalized device coordinates; 1 is the frame edge. */
  limit: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraPose {
  distance: number;
  elevationDeg: number;
  offsetX: number;
  offsetY: number;
}

/** Where the camera rig aims, and from how far and how high. */
export interface ViewPose {
  lookAt: Vec3;
  elevationDeg: number;
  distance: number;
}

/** Size of the keyboard case in world units, plus breathing room around it. */
export const KEYBOARD_EXTENT: KeyboardExtent = { width: 15.9, depth: 5.9, margin: 0.6 };
export const CAMERA_FOV = 32;
export const CAMERA_LOOK_AT: Vec3 = { x: 0, y: 0, z: 0.3 };
export const PANEL_ELEVATION_DEG = 62;
/** Largest camera shift the pointer parallax applies, in world units. */
export const CAMERA_PARALLAX = { x: 0.8, y: 0.4 };
/** Resting view: the monitor and the keyboard together, from above the desk, centered top to bottom. */
export const DESK_LOOK_AT: Vec3 = { x: 0, y: 3.8, z: -3 };
export const DESK_ELEVATION_DEG = 28;
/** Largest share of the frame, per axis in NDC, the desk covers, leaving a little room at the edges. */
export const DESK_FILL = 0.94;
/** Largest share of the frame, per axis in NDC, the screen covers in the reading view. */
export const SCREEN_FILL = 0.94;
/** The desktop DOM never lays out narrower than this, however small the screen is drawn. */
export const MIN_SCREEN_PX = 960;
export const MAX_SCREEN_PX = 1600;
// The reading view aims this far below the screen center, so the keyboard's back rows peek in under it.
const SCREEN_LOOK_DROP = 0.8;
const NO_PARALLAX = { x: 0, y: 0 };
// Vertical span the keyboard can occupy: case bottom up to lifted, floating key tops.
const CASE_BOTTOM_Y = -0.5;
const KEY_TOP_Y = 0.6;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

function assertPositive(name: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite positive number, got ${value}`);
  }
}

export function visibleWidthAt(distance: number, fovDeg: number, aspect: number): number {
  return 2 * distance * Math.tan(toRadians(fovDeg) / 2) * aspect;
}

/**
 * Smallest camera distance at which every corner stays within `limit` of the frame center, for every
 * pointer-parallax extreme. The camera looks down at the scene, so near edges appear wider than far
 * ones; corners are projected instead of assuming a flat rectangle.
 */
export function fitCorners({ corners, lookAt, aspect, fovDeg, elevationDeg, parallax, limit }: FitCornersOptions): number {
  assertPositive("aspect", aspect);
  assertPositive("fovDeg", fovDeg);
  assertPositive("elevationDeg", elevationDeg);
  assertPositive("limit", limit);
  const offsets = [
    [0, 0],
    [parallax.x, parallax.y],
    [-parallax.x, -parallax.y],
    [parallax.x, -parallax.y],
    [-parallax.x, parallax.y],
  ];
  const fits = (distance: number) =>
    offsets.every(([offsetX, offsetY]) => {
      const eye = cameraPosition({ distance, elevationDeg, offsetX, offsetY }, lookAt);
      return corners.every((corner) => {
        const p = projectToNdc(corner, eye, fovDeg, aspect, lookAt);
        return Math.abs(p.x) <= limit && Math.abs(p.y) <= limit;
      });
    });

  // Projected size shrinks monotonically with distance, so bisect between a too-close and a fitting distance.
  let near = 1;
  let far = 16;
  while (!fits(far)) {
    far *= 2;
    if (far > 1e5) throw new RangeError(`No camera distance fits the corners at aspect ${aspect}`);
  }
  for (let i = 0; i < 40; i++) {
    const middle = (near + far) / 2;
    if (fits(middle)) far = middle;
    else near = middle;
  }
  return far;
}

/** Smallest camera distance at which every corner of the keyboard alone stays on screen. */
export function fitCameraDistance({ aspect, fovDeg, elevationDeg, ...extent }: FitOptions): number {
  return fitCorners({
    corners: caseCorners(extent),
    lookAt: CAMERA_LOOK_AT,
    aspect,
    fovDeg,
    elevationDeg,
    parallax: CAMERA_PARALLAX,
    limit: 1,
  });
}

/** Resting view that keeps the keyboard and the whole monitor in frame. */
export function deskPose(aspect: number): ViewPose {
  const distance = fitCorners({
    corners: [...caseCorners(), ...monitorCorners()],
    lookAt: DESK_LOOK_AT,
    aspect,
    fovDeg: CAMERA_FOV,
    elevationDeg: DESK_ELEVATION_DEG,
    parallax: CAMERA_PARALLAX,
    limit: DESK_FILL,
  });
  return { lookAt: DESK_LOOK_AT, elevationDeg: DESK_ELEVATION_DEG, distance };
}

/** Reading view: head-on to the leaning screen, as close as `SCREEN_FILL` allows. It takes no parallax. */
export function screenPose(aspect: number): ViewPose {
  const lookAt = { ...SCREEN_CENTER, y: SCREEN_CENTER.y - SCREEN_LOOK_DROP };
  const distance = fitCorners({
    corners: screenCorners(),
    lookAt,
    aspect,
    fovDeg: CAMERA_FOV,
    elevationDeg: SCREEN_TILT_DEG,
    parallax: NO_PARALLAX,
    limit: SCREEN_FILL,
  });
  return { lookAt, elevationDeg: SCREEN_TILT_DEG, distance };
}

/**
 * CSS pixel size to lay the desktop out at for a canvas of this size: the screen's on-screen width in the
 * reading view, so text there renders close to 1:1, kept within readable bounds.
 */
export function screenResolution(canvasWidth: number, canvasHeight: number): { width: number; height: number } {
  assertPositive("canvasWidth", canvasWidth);
  assertPositive("canvasHeight", canvasHeight);
  const aspect = canvasWidth / canvasHeight;
  const pose = screenPose(aspect);
  const eye = cameraPosition({ distance: pose.distance, elevationDeg: pose.elevationDeg, offsetX: 0, offsetY: 0 }, pose.lookAt);
  const xs = screenCorners().map((corner) => projectToNdc(corner, eye, CAMERA_FOV, aspect, pose.lookAt).x);
  const drawnWidth = ((Math.max(...xs) - Math.min(...xs)) / 2) * canvasWidth;
  const width = Math.round(Math.min(Math.max(drawnWidth, MIN_SCREEN_PX), MAX_SCREEN_PX));
  return { width, height: Math.round((width * SCREEN_SIZE.height) / SCREEN_SIZE.width) };
}

/** Camera position for a pose around `lookAt`, matching the scene's camera rig. */
export function cameraPosition(
  { distance, elevationDeg, offsetX, offsetY }: CameraPose,
  lookAt: Vec3 = CAMERA_LOOK_AT,
): Vec3 {
  const elevation = toRadians(elevationDeg);
  return {
    x: lookAt.x + offsetX,
    y: lookAt.y + distance * Math.sin(elevation) + offsetY,
    z: lookAt.z + distance * Math.cos(elevation),
  };
}

/** Corners of the keyboard's bounding box, padded by the extent margin. */
export function caseCorners(extent: KeyboardExtent = KEYBOARD_EXTENT): Vec3[] {
  const halfWidth = extent.width / 2 + extent.margin;
  const halfDepth = extent.depth / 2 + extent.margin;
  const corners: Vec3[] = [];
  for (const x of [-halfWidth, halfWidth]) {
    for (const y of [CASE_BOTTOM_Y, KEY_TOP_Y]) {
      for (const z of [-halfDepth, halfDepth]) corners.push({ x, y, z });
    }
  }
  return corners;
}

const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};

/**
 * Normalized device coordinates (−1…1 on screen) of `point` for a camera at `eye` looking at
 * `target` with world-up +Y. Points behind the camera map to Infinity so they never count as visible.
 */
export function projectToNdc(point: Vec3, eye: Vec3, fovDeg: number, aspect: number, target: Vec3 = CAMERA_LOOK_AT) {
  const forward = normalize({ x: target.x - eye.x, y: target.y - eye.y, z: target.z - eye.z });
  const right = normalize(cross(forward, { x: 0, y: 1, z: 0 }));
  const up = cross(right, forward);
  const v = { x: point.x - eye.x, y: point.y - eye.y, z: point.z - eye.z };
  const depth = dot(v, forward);
  if (depth <= 0) return { x: Infinity, y: Infinity };
  const halfVertical = Math.tan(toRadians(fovDeg) / 2);
  return { x: dot(v, right) / (depth * halfVertical * aspect), y: dot(v, up) / (depth * halfVertical) };
}
