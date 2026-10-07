"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { KeyDef, KeyKind } from "@/components/keyboard/layout";
import { playKeySound } from "@/components/keyboard/sound";

const CAP_HEIGHT = 0.42;
const CAP_DEPTH = 0.9;
const CAP_BASE_Y = 0.02;

const CAP_GAP = 0.1;
const LEGEND_INSET = 0.26;
const LEGEND_DEPTH = 0.64;
const LEGEND_PX_PER_UNIT = 200;
const LEGEND_FONT = '"Helvetica Neue", Arial, sans-serif';
const LEGEND_INK = "#413e38";
const ACCENT = "#c5f36b";

const HOVER_LIFT = 0.05;
const DAMPING = 14;
const INTRO_DROP = 1.6;
const INTRO_STIFFNESS = 170;
const INTRO_DAMPING = 16;
const GLOW_OPACITY = 0.85;
const PRESS_TRAVEL = 0.16;
const PRESS_HOLD_SECONDS = 0.09;
const PRESS_DOWN_DAMPING = 60;
const RELEASE_STIFFNESS = 260;
const RELEASE_DAMPING = 18;
// Dark action caps need less tint, or their lime legend disappears into it.
const TINT_INTENSITY: Record<KeyKind, number> = { word: 0.22, blank: 0.22, modifier: 0.22, action: 0.1 };

const CAP_COLORS: Record<KeyKind, string> = {
  word: "#DFD2C3",
  blank: "#DFD2C3",
  modifier: "#CBBBA6",
  action: "#2B2722",
};

// Shared for the page lifetime: every key of the same width reuses one geometry.
const capGeometries = new Map<number, RoundedBoxGeometry>();

function capGeometry(width: number): RoundedBoxGeometry {
  let geometry = capGeometries.get(width);
  if (!geometry) {
    geometry = new RoundedBoxGeometry(width - CAP_GAP, CAP_HEIGHT, CAP_DEPTH, 4, 0.08);
    capGeometries.set(width, geometry);
  }
  return geometry;
}

function createLegendTexture(def: KeyDef): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(LEGEND_PX_PER_UNIT * (def.width - LEGEND_INSET));
  canvas.height = Math.round(LEGEND_PX_PER_UNIT * LEGEND_DEPTH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(`Could not get a 2D canvas context to draw the legend of key "${def.id}"`);

  if (def.kind === "word") {
    ctx.font = `bold 70px ${LEGEND_FONT}`;
    ctx.fillStyle = LEGEND_INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.legend, canvas.width / 2, canvas.height / 2 + 4);
  } else if (def.kind === "action") {
    ctx.font = `600 40px ${LEGEND_FONT}`;
    ctx.fillStyle = ACCENT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.legend, canvas.width / 2, canvas.height / 2 + 2);
  } else {
    ctx.font = `600 30px ${LEGEND_FONT}`;
    ctx.fillStyle = LEGEND_INK;
    ctx.textBaseline = "alphabetic";
    const centered = def.id === "space";
    ctx.textAlign = centered ? "center" : "left";
    ctx.fillText(def.legend, centered ? canvas.width / 2 : 14, canvas.height - 18);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export interface KeyPress {
  nonce: number;
  delayMs: number;
}

interface KeycapProps {
  def: KeyDef;
  position: [number, number, number];
  highlighted: boolean;
  press: KeyPress | null;
  introDelay: number;
  reducedMotion: boolean;
  onPointerOver(def: KeyDef): void;
  onPointerOut(def: KeyDef): void;
  onPointerDown(def: KeyDef): void;
  onClick(def: KeyDef): void;
}

export const Keycap = memo(function Keycap({
  def,
  position,
  highlighted,
  press,
  introDelay,
  reducedMotion,
  onPointerOver,
  onPointerOut,
  onPointerDown,
  onClick,
}: KeycapProps) {
  const capRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);
  const motion = useRef({ lift: 0, introOffset: reducedMotion ? 0 : INTRO_DROP, introVelocity: 0, startedAt: -1 });
  // pendingDelay: a press waiting to be scheduled on the R3F clock; startAt/releaseAt: clock times.
  const pressMotion = useRef({ pendingDelay: -1, startAt: -1, releaseAt: -1, offset: 0, velocity: 0 });
  // The frameloop runs on demand under reduced motion (and behind a settled panel), so changes must ask for a frame.
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (press) pressMotion.current.pendingDelay = press.delayMs / 1000;
    invalidate();
  }, [press, invalidate]);

  useEffect(() => {
    invalidate();
  }, [highlighted, invalidate]);

  // Per key (not shared) so each cap's lime tint can fade in and out on its own.
  const capMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: CAP_COLORS[def.kind],
        roughness: 0.62,
        metalness: 0,
        emissive: ACCENT,
        emissiveIntensity: 0,
      }),
    [def.kind],
  );

  useEffect(() => () => capMaterial.dispose(), [capMaterial]);

  const legend = useMemo(() => {
    if (!def.legend) return null;
    const texture = createLegendTexture(def);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.62,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    return { texture, material };
  }, [def]);

  useEffect(() => {
    if (!legend) return;
    return () => {
      legend.texture.dispose();
      legend.material.dispose();
    };
  }, [legend]);

  useFrame((state, rawDelta) => {
    const cap = capRef.current;
    const glow = glowRef.current;
    if (!cap || !glow) return;
    // Clamp so a long pause (background tab) can't make the spring explode.
    const delta = Math.min(rawDelta, 1 / 30);
    const m = motion.current;
    if (m.startedAt < 0) m.startedAt = state.clock.elapsedTime;

    const liftTarget = highlighted ? HOVER_LIFT : 0;
    const glowTarget = highlighted ? GLOW_OPACITY : 0;
    const tintTarget = highlighted ? TINT_INTENSITY[def.kind] : 0;
    if (reducedMotion) {
      m.lift = liftTarget;
      m.introOffset = 0;
      glow.opacity = glowTarget;
      capMaterial.emissiveIntensity = tintTarget;
    } else {
      m.lift = THREE.MathUtils.damp(m.lift, liftTarget, DAMPING, delta);
      glow.opacity = THREE.MathUtils.damp(glow.opacity, glowTarget, DAMPING, delta);
      capMaterial.emissiveIntensity = THREE.MathUtils.damp(capMaterial.emissiveIntensity, tintTarget, DAMPING, delta);
      if (m.introOffset !== 0 && state.clock.elapsedTime - m.startedAt >= introDelay) {
        const acceleration = -INTRO_STIFFNESS * m.introOffset - INTRO_DAMPING * m.introVelocity;
        m.introVelocity += acceleration * delta;
        m.introOffset += m.introVelocity * delta;
        if (Math.abs(m.introOffset) < 5e-4 && Math.abs(m.introVelocity) < 1e-3) m.introOffset = 0;
      }
    }
    const p = pressMotion.current;
    const now = state.clock.elapsedTime;
    if (p.pendingDelay >= 0) {
      p.startAt = now + p.pendingDelay;
      p.pendingDelay = -1;
    }
    if (p.startAt >= 0 && now >= p.startAt) {
      p.startAt = -1;
      p.releaseAt = now + PRESS_HOLD_SECONDS;
      playKeySound(def);
    }
    if (p.releaseAt >= 0 && now < p.releaseAt) {
      p.offset = reducedMotion ? -PRESS_TRAVEL : THREE.MathUtils.damp(p.offset, -PRESS_TRAVEL, PRESS_DOWN_DAMPING, delta);
      p.velocity = 0;
    } else if (p.offset !== 0) {
      p.releaseAt = -1;
      if (reducedMotion) {
        p.offset = 0;
      } else {
        p.velocity += (-RELEASE_STIFFNESS * p.offset - RELEASE_DAMPING * p.velocity) * delta;
        p.offset += p.velocity * delta;
        if (Math.abs(p.offset) < 5e-4 && Math.abs(p.velocity) < 1e-3) p.offset = 0;
      }
    }
    // Keep frames coming until a press has played its sound and the cap is back at rest.
    if (p.pendingDelay >= 0 || p.startAt >= 0 || (p.releaseAt >= 0 && now < p.releaseAt) || p.offset !== 0) {
      state.invalidate();
    }

    cap.position.y = m.introOffset + m.lift + p.offset;
  });

  const width = def.width - CAP_GAP;
  const capCenterY = CAP_BASE_Y + CAP_HEIGHT / 2;

  return (
    <group position={position}>
      <group ref={capRef}>
        <mesh
          geometry={capGeometry(def.width)}
          material={capMaterial}
          position-y={capCenterY}
          castShadow
          receiveShadow
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            onPointerOver(def);
          }}
          onPointerOut={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            onPointerOut(def);
          }}
          onPointerDown={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            // Only a primary click activates a key, so other buttons get no press either.
            if (event.button !== 0) return;
            onPointerDown(def);
          }}
          onClick={(event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            onClick(def);
          }}
        />
        {legend && (
          <mesh material={legend.material} position-y={CAP_BASE_Y + CAP_HEIGHT + 0.002} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[def.width - LEGEND_INSET, LEGEND_DEPTH]} />
          </mesh>
        )}
      </group>
      <mesh position-y={0.014} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[width + 0.22, CAP_DEPTH + 0.12]} />
        <meshBasicMaterial
          ref={glowRef}
          color={ACCENT}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});
