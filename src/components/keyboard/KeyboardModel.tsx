"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { KEYS, ROW_COUNT, ROW_UNITS } from "@/components/keyboard/layout";
import type { ActionId, KeyDef, SectionId } from "@/components/keyboard/layout";
import type { TypingMatch } from "@/components/keyboard/typing";
import { Keycap } from "@/components/keyboard/Keycap";
import type { KeyPress } from "@/components/keyboard/Keycap";

export type HighlightTarget = { kind: "section"; id: SectionId } | { kind: "action"; id: ActionId };

export interface PressSignal {
  nonce: number;
  presses: { keyId: string; delayMs: number }[];
}

export interface KeyboardModelProps {
  highlight: HighlightTarget | null;
  typedMatch: TypingMatch | null;
  pressSignal: PressSignal;
  reducedMotion: boolean;
  onHoverChange(target: HighlightTarget | null): void;
  /** Press feedback only: fires as soon as a key goes down. */
  onKeyPointerDown(key: KeyDef): void;
  /** Activation: fires on release over the same key, which also counts as a user gesture on touch. */
  onKeyClick(key: KeyDef): void;
}

const CASE_SIZE = { width: 15.9, height: 0.5, depth: 5.9 };
const BEZEL_SIZE = { width: 15.15, height: 0.04, depth: 5.15 };
const INTRO_SECONDS = 1.2;
const INTRO_RISE = 2.5;
const INTRO_TILT = 0.5;
const FLOAT_AMPLITUDE = 0.04;
const FLOAT_SPEED = 0.8;
const GLOW_INTENSITY = 2.5;
const GLOW_HEIGHT = 1.4;

function keyPosition(key: KeyDef): [number, number, number] {
  return [key.x + key.width / 2 - ROW_UNITS / 2, 0, key.row - (ROW_COUNT - 1) / 2];
}

// Precomputed so memoized keycaps receive stable position arrays.
const KEY_POSITIONS = new Map(KEYS.map((key) => [key.id, keyPosition(key)]));

function introDelayFor(key: KeyDef): number {
  return 0.35 + key.row * 0.12 + (key.x / ROW_UNITS) * 0.15;
}

function hoverTargetFor(key: KeyDef): HighlightTarget | null {
  if (key.kind === "word" && key.section) return { kind: "section", id: key.section };
  if (key.kind === "action" && key.action) return { kind: "action", id: key.action };
  return null;
}

function isHighlighted(key: KeyDef, highlight: HighlightTarget | null, typedMatch: TypingMatch | null): boolean {
  if (highlight?.kind === "section" && key.section === highlight.id) return true;
  if (highlight?.kind === "action" && key.action === highlight.id) return true;
  return typedMatch !== null && key.section === typedMatch.section && (key.index ?? Infinity) < typedMatch.length;
}

/** Deterministic PRNG so the wood grain looks the same on every visit. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a 2D canvas context to draw the keyboard's wood texture");

  const base = ctx.createLinearGradient(0, 0, 0, canvas.height);
  base.addColorStop(0, "#ad7440");
  base.addColorStop(0.5, "#895128");
  base.addColorStop(1, "#63391a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const random = seededRandom(23);
  for (let i = 0; i < 140; i++) {
    const y0 = random() * canvas.height;
    const amplitude = 2 + random() * 9;
    const frequency = 0.002 + random() * 0.006;
    const phase = random() * Math.PI * 2;
    ctx.strokeStyle = `rgba(45, 23, 7, ${(0.1 + random() * 0.15).toFixed(3)})`;
    ctx.lineWidth = 0.5 + random() * 2;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 8) {
      const y = y0 + amplitude * Math.sin(x * frequency + phase) + amplitude * 0.4 * Math.sin(x * frequency * 3.1 + phase);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function KeyboardModel({
  highlight,
  typedMatch,
  pressSignal,
  reducedMotion,
  onHoverChange,
  onKeyPointerDown,
  onKeyClick,
}: KeyboardModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);
  const introStartedAt = useRef(-1);
  const [pointerOverInteractive, setPointerOverInteractive] = useState(false);

  const shell = useMemo(() => {
    const woodTexture = createWoodTexture();
    return {
      woodTexture,
      caseGeometry: new RoundedBoxGeometry(CASE_SIZE.width, CASE_SIZE.height, CASE_SIZE.depth, 4, 0.14),
      caseMaterial: new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.55 }),
      bezelGeometry: new THREE.BoxGeometry(BEZEL_SIZE.width, BEZEL_SIZE.height, BEZEL_SIZE.depth),
      bezelMaterial: new THREE.MeshStandardMaterial({ color: "#0e0c08", roughness: 0.8 }),
    };
  }, []);

  useEffect(
    () => () => {
      shell.woodTexture.dispose();
      shell.caseGeometry.dispose();
      shell.caseMaterial.dispose();
      shell.bezelGeometry.dispose();
      shell.bezelMaterial.dispose();
    },
    [shell],
  );

  useEffect(() => {
    if (!pointerOverInteractive) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [pointerOverInteractive]);

  const pressByKey = useMemo(
    () =>
      new Map<string, KeyPress>(
        pressSignal.presses.map(({ keyId, delayMs }) => [keyId, { nonce: pressSignal.nonce, delayMs }]),
      ),
    [pressSignal],
  );

  const highlightedKeys = useMemo(
    () => KEYS.filter((key) => isHighlighted(key, highlight, typedMatch)),
    [highlight, typedMatch],
  );
  const highlightedIds = useMemo(() => new Set(highlightedKeys.map((key) => key.id)), [highlightedKeys]);
  const glowCentroid = useMemo(() => {
    if (highlightedKeys.length === 0) return null;
    const sum = highlightedKeys.reduce(
      (acc, key) => {
        const [x, , z] = keyPosition(key);
        return [acc[0] + x, acc[1] + z];
      },
      [0, 0],
    );
    return [sum[0] / highlightedKeys.length, sum[1] / highlightedKeys.length] as const;
  }, [highlightedKeys]);

  const handlePointerOver = useCallback(
    (key: KeyDef) => {
      const target = hoverTargetFor(key);
      onHoverChange(target);
      setPointerOverInteractive(target !== null);
    },
    [onHoverChange],
  );

  const handlePointerOut = useCallback(() => {
    onHoverChange(null);
    setPointerOverInteractive(false);
  }, [onHoverChange]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const light = glowLightRef.current;
    if (!group || !light) return;

    if (glowCentroid) light.position.set(glowCentroid[0], GLOW_HEIGHT, glowCentroid[1]);
    const glowTarget = glowCentroid ? GLOW_INTENSITY : 0;
    light.intensity = reducedMotion ? glowTarget : THREE.MathUtils.damp(light.intensity, glowTarget, 8, delta);

    if (reducedMotion) {
      group.position.y = 0;
      group.rotation.x = 0;
      return;
    }
    const now = state.clock.elapsedTime;
    if (introStartedAt.current < 0) introStartedAt.current = now;
    const t = Math.min((now - introStartedAt.current) / INTRO_SECONDS, 1);
    const eased = 1 - (1 - t) ** 3;
    // Fade the float in with the intro so it doesn't jump when the intro ends.
    group.position.y = -INTRO_RISE * (1 - eased) + eased * FLOAT_AMPLITUDE * Math.sin(now * FLOAT_SPEED);
    group.rotation.x = INTRO_TILT * (1 - eased);
  });

  return (
    <group ref={groupRef}>
      <mesh
        geometry={shell.caseGeometry}
        material={shell.caseMaterial}
        position-y={-CASE_SIZE.height / 2}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={shell.bezelGeometry}
        material={shell.bezelMaterial}
        position-y={BEZEL_SIZE.height / 2 - 0.035}
        receiveShadow
      />
      {KEYS.map((key) => (
        <Keycap
          key={key.id}
          def={key}
          position={KEY_POSITIONS.get(key.id)!}
          highlighted={highlightedIds.has(key.id)}
          press={pressByKey.get(key.id) ?? null}
          introDelay={introDelayFor(key)}
          reducedMotion={reducedMotion}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerDown={onKeyPointerDown}
          onClick={onKeyClick}
        />
      ))}
      <pointLight ref={glowLightRef} color="#c5f36b" distance={9} decay={2} intensity={0} />
    </group>
  );
}
