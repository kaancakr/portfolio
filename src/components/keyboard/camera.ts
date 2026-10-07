export interface FitOptions {
  aspect: number;
  /** Vertical field of view, in degrees. */
  fovDeg: number;
  width: number;
  depth: number;
  margin: number;
}

/** Size of the keyboard case in world units, plus breathing room around it. */
export const KEYBOARD_EXTENT = { width: 15.9, depth: 5.9, margin: 0.6 };
export const CAMERA_FOV = 32;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

function assertPositive(name: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite positive number, got ${value}`);
  }
}

export function visibleWidthAt(distance: number, fovDeg: number, aspect: number): number {
  return 2 * distance * Math.tan(toRadians(fovDeg) / 2) * aspect;
}

export function fitCameraDistance({ aspect, fovDeg, width, depth, margin }: FitOptions): number {
  assertPositive("aspect", aspect);
  assertPositive("fovDeg", fovDeg);
  const halfVertical = Math.tan(toRadians(fovDeg) / 2);
  const halfHorizontal = halfVertical * aspect;
  const widthLimited = (width / 2 + margin) / halfHorizontal;
  const depthLimited = (depth / 2 + margin) / halfVertical;
  return Math.max(widthLimited, depthLimited);
}
