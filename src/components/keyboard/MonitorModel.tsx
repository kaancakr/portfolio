"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { BEZEL, BODY_DEPTH, SCREEN_CENTER, SCREEN_SIZE, SCREEN_TILT_DEG, screenPoint } from "@/components/keyboard/monitor";

const DESK_Y = -0.5;
const NECK = { width: 1.5, depth: 0.4 };
const BASE = { width: 5.4, height: 0.14, depth: 3 };
// The neck meets the body this far below the screen center, in the screen's own frame.
const NECK_JOIN_V = -1;
// The base reaches this far forward of the neck, toward the keyboard.
const BASE_FORWARD = 0.5;

type Position = [number, number, number];

/** Neck and base positions, derived from where the neck meets the back of the leaning body. */
function standLayout(): { neck: { height: number; position: Position }; base: { position: Position } } {
  const join = screenPoint(0, NECK_JOIN_V, -BODY_DEPTH);
  const neckZ = join.z - NECK.depth / 2;
  const neckBottom = DESK_Y + BASE.height;
  const neckHeight = join.y - neckBottom;
  return {
    neck: { height: neckHeight, position: [0, neckBottom + neckHeight / 2, neckZ] },
    base: { position: [0, DESK_Y + BASE.height / 2, neckZ + BASE_FORWARD] },
  };
}

/** A thin-bezel monitor behind the keyboard. Its screen is a dark pane; the desktop DOM is projected over it. */
export function MonitorModel() {
  const parts = useMemo(() => {
    const stand = standLayout();
    return {
      stand,
      bodyGeometry: new RoundedBoxGeometry(SCREEN_SIZE.width + 2 * BEZEL, SCREEN_SIZE.height + 2 * BEZEL, BODY_DEPTH, 4, 0.12),
      bodyMaterial: new THREE.MeshStandardMaterial({ color: "#141716", roughness: 0.42, metalness: 0.35 }),
      glassGeometry: new THREE.PlaneGeometry(SCREEN_SIZE.width, SCREEN_SIZE.height),
      glassMaterial: new THREE.MeshBasicMaterial({ color: "#050707" }),
      neckGeometry: new RoundedBoxGeometry(NECK.width, stand.neck.height, NECK.depth, 2, 0.08),
      baseGeometry: new RoundedBoxGeometry(BASE.width, BASE.height, BASE.depth, 2, 0.06),
      standMaterial: new THREE.MeshStandardMaterial({ color: "#2a2e2d", roughness: 0.3, metalness: 0.6 }),
    };
  }, []);

  useEffect(
    () => () => {
      parts.bodyGeometry.dispose();
      parts.bodyMaterial.dispose();
      parts.glassGeometry.dispose();
      parts.glassMaterial.dispose();
      parts.neckGeometry.dispose();
      parts.baseGeometry.dispose();
      parts.standMaterial.dispose();
    },
    [parts],
  );

  return (
    <group>
      <group
        position={[SCREEN_CENTER.x, SCREEN_CENTER.y, SCREEN_CENTER.z]}
        rotation-x={-THREE.MathUtils.degToRad(SCREEN_TILT_DEG)}
      >
        <mesh geometry={parts.bodyGeometry} material={parts.bodyMaterial} position-z={-BODY_DEPTH / 2} castShadow />
        <mesh geometry={parts.glassGeometry} material={parts.glassMaterial} position-z={0.002} />
      </group>
      <mesh geometry={parts.neckGeometry} material={parts.standMaterial} position={parts.stand.neck.position} castShadow />
      <mesh
        geometry={parts.baseGeometry}
        material={parts.standMaterial}
        position={parts.stand.base.position}
        castShadow
        receiveShadow
      />
    </group>
  );
}
