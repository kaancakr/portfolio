import type { Vec3 } from "./camera.ts";

/** Visible screen area, in world units (16:10). The desktop DOM is projected onto exactly this rectangle. */
export const SCREEN_SIZE = { width: 16, height: 10 };
/** Center of the screen surface; the monitor stands behind the keyboard, which spans z −2.95…2.95. */
export const SCREEN_CENTER: Vec3 = { x: 0, y: 5.6, z: -6.2 };
/** How far the screen leans back, so the camera above the desk sees it closer to head-on. */
export const SCREEN_TILT_DEG = 6;
/** Frame around the screen, and the depth of the body behind the glass. */
export const BEZEL = 0.35;
export const BODY_DEPTH = 0.45;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

/**
 * World position of a point given in the screen's own frame: `u` right and `v` up from the screen
 * center, `w` out of the glass toward the viewer.
 */
export function screenPoint(u: number, v: number, w = 0): Vec3 {
  const tilt = toRadians(SCREEN_TILT_DEG);
  return {
    x: SCREEN_CENTER.x + u,
    y: SCREEN_CENTER.y + v * Math.cos(tilt) + w * Math.sin(tilt),
    z: SCREEN_CENTER.z - v * Math.sin(tilt) + w * Math.cos(tilt),
  };
}

/** Corners of the visible screen surface. */
export function screenCorners(): Vec3[] {
  const halfWidth = SCREEN_SIZE.width / 2;
  const halfHeight = SCREEN_SIZE.height / 2;
  return [-1, 1].flatMap((sx) => [-1, 1].map((sy) => screenPoint(sx * halfWidth, sy * halfHeight)));
}

/** Corners of the monitor body: the bezel's front face, flush with the glass, and its back. */
export function monitorCorners(): Vec3[] {
  const halfWidth = SCREEN_SIZE.width / 2 + BEZEL;
  const halfHeight = SCREEN_SIZE.height / 2 + BEZEL;
  return [-1, 1].flatMap((sx) =>
    [-1, 1].flatMap((sy) => [0, -BODY_DEPTH].map((w) => screenPoint(sx * halfWidth, sy * halfHeight, w))),
  );
}
