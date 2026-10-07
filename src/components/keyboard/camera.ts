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

/** Size of the keyboard case in world units, plus breathing room around it. */
export const KEYBOARD_EXTENT: KeyboardExtent = { width: 15.9, depth: 5.9, margin: 0.6 };
export const CAMERA_FOV = 32;
export const CAMERA_LOOK_AT: Vec3 = { x: 0, y: 0, z: 0.3 };
export const CAMERA_ELEVATION_DEG = 52;
export const PANEL_ELEVATION_DEG = 62;
/** Largest camera shift the pointer parallax applies, in world units. */
export const CAMERA_PARALLAX = { x: 0.8, y: 0.4 };
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
 * Smallest camera distance at which every corner of the keyboard stays on screen, for every
 * pointer-parallax extreme. The camera looks down at the keyboard, so the near edge appears
 * wider than the look-at plane; corners are projected instead of assuming a flat rectangle.
 */
export function fitCameraDistance({ aspect, fovDeg, elevationDeg, ...extent }: FitOptions): number {
  assertPositive("aspect", aspect);
  assertPositive("fovDeg", fovDeg);
  assertPositive("elevationDeg", elevationDeg);
  const corners = caseCorners(extent);
  const offsets = [
    [0, 0],
    [CAMERA_PARALLAX.x, CAMERA_PARALLAX.y],
    [-CAMERA_PARALLAX.x, -CAMERA_PARALLAX.y],
    [CAMERA_PARALLAX.x, -CAMERA_PARALLAX.y],
    [-CAMERA_PARALLAX.x, CAMERA_PARALLAX.y],
  ];
  const fits = (distance: number) =>
    offsets.every(([offsetX, offsetY]) => {
      const eye = cameraPosition({ distance, elevationDeg, offsetX, offsetY });
      return corners.every((corner) => {
        const p = projectToNdc(corner, eye, fovDeg, aspect);
        return Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1;
      });
    });

  // Projected size shrinks monotonically with distance, so bisect between a too-close and a fitting distance.
  let near = 1;
  let far = 16;
  while (!fits(far)) {
    far *= 2;
    if (far > 1e5) throw new RangeError(`No camera distance fits the keyboard at aspect ${aspect}`);
  }
  for (let i = 0; i < 40; i++) {
    const middle = (near + far) / 2;
    if (fits(middle)) far = middle;
    else near = middle;
  }
  return far;
}

/** Camera position for a pose, matching the scene's camera rig. */
export function cameraPosition({ distance, elevationDeg, offsetX, offsetY }: CameraPose): Vec3 {
  const elevation = toRadians(elevationDeg);
  return {
    x: CAMERA_LOOK_AT.x + offsetX,
    y: CAMERA_LOOK_AT.y + distance * Math.sin(elevation) + offsetY,
    z: CAMERA_LOOK_AT.z + distance * Math.cos(elevation),
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
