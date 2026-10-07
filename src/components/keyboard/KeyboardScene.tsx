"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAMERA_ELEVATION_DEG,
  CAMERA_FOV,
  CAMERA_LOOK_AT,
  CAMERA_PARALLAX,
  KEYBOARD_EXTENT,
  PANEL_ELEVATION_DEG,
  fitCameraDistance,
} from "@/components/keyboard/camera";
import { KeyboardModel } from "@/components/keyboard/KeyboardModel";
import type { KeyboardModelProps } from "@/components/keyboard/KeyboardModel";

export interface KeyboardSceneProps extends KeyboardModelProps {
  panelOpen: boolean;
  paused: boolean;
  onContextLost(): void;
}

const LOOK_AT = new THREE.Vector3(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);
const ELEVATION = THREE.MathUtils.degToRad(CAMERA_ELEVATION_DEG);
const PANEL_ELEVATION = THREE.MathUtils.degToRad(PANEL_ELEVATION_DEG);
const INTRO_ELEVATION = THREE.MathUtils.degToRad(70);
const PANEL_DISTANCE_FACTOR = 1.18;
const INTRO_DISTANCE_FACTOR = 1.5;
const CAMERA_DAMPING = 3;

const AMBIENT_INTENSITY = 0.45;
const SPOT_INTENSITY = 220;
const PANEL_LIGHT_FACTOR = 0.4;

function CameraRig({ panelOpen, reducedMotion }: { panelOpen: boolean; reducedMotion: boolean }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const finePointer = useMemo(() => window.matchMedia("(pointer: fine)").matches, []);
  const rig = useRef<{ distance: number; elevation: number; offsetX: number; offsetY: number } | null>(null);
  // The fit is a small numeric search, so run it per canvas size rather than per frame.
  const fitted = useMemo(() => {
    if (size.width === 0 || size.height === 0) return null;
    const aspect = size.width / size.height;
    return {
      resting: fitCameraDistance({ aspect, fovDeg: CAMERA_FOV, elevationDeg: CAMERA_ELEVATION_DEG, ...KEYBOARD_EXTENT }),
      panel: fitCameraDistance({ aspect, fovDeg: CAMERA_FOV, elevationDeg: PANEL_ELEVATION_DEG, ...KEYBOARD_EXTENT }),
    };
  }, [size.width, size.height]);

  // With on-demand frames, nothing else would render the camera and light change when a panel opens or closes.
  useEffect(() => {
    invalidate();
  }, [panelOpen, invalidate]);

  useFrame((state, delta) => {
    if (!fitted) return;
    const target = {
      distance: panelOpen ? fitted.panel * PANEL_DISTANCE_FACTOR : fitted.resting,
      elevation: panelOpen ? PANEL_ELEVATION : ELEVATION,
      offsetX: finePointer && !reducedMotion ? state.pointer.x * CAMERA_PARALLAX.x : 0,
      offsetY: finePointer && !reducedMotion ? state.pointer.y * CAMERA_PARALLAX.y : 0,
    };

    if (!rig.current) {
      rig.current = reducedMotion
        ? { ...target }
        : { distance: fitted.resting * INTRO_DISTANCE_FACTOR, elevation: INTRO_ELEVATION, offsetX: 0, offsetY: 0 };
    }
    const current = rig.current;
    if (reducedMotion) {
      Object.assign(current, target);
    } else {
      current.distance = THREE.MathUtils.damp(current.distance, target.distance, CAMERA_DAMPING, delta);
      current.elevation = THREE.MathUtils.damp(current.elevation, target.elevation, CAMERA_DAMPING, delta);
      current.offsetX = THREE.MathUtils.damp(current.offsetX, target.offsetX, CAMERA_DAMPING, delta);
      current.offsetY = THREE.MathUtils.damp(current.offsetY, target.offsetY, CAMERA_DAMPING, delta);
    }

    camera.position.set(
      LOOK_AT.x + current.offsetX,
      LOOK_AT.y + current.distance * Math.sin(current.elevation) + current.offsetY,
      LOOK_AT.z + current.distance * Math.cos(current.elevation),
    );
    camera.lookAt(LOOK_AT);
  });

  return null;
}

function Lights({ panelOpen, reducedMotion }: { panelOpen: boolean; reducedMotion: boolean }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);

  useFrame((_, delta) => {
    const ambient = ambientRef.current;
    const spot = spotRef.current;
    if (!ambient || !spot) return;
    const factor = panelOpen ? PANEL_LIGHT_FACTOR : 1;
    const ambientTarget = AMBIENT_INTENSITY * factor;
    const spotTarget = SPOT_INTENSITY * factor;
    ambient.intensity = reducedMotion ? ambientTarget : THREE.MathUtils.damp(ambient.intensity, ambientTarget, 4, delta);
    spot.intensity = reducedMotion ? spotTarget : THREE.MathUtils.damp(spot.intensity, spotTarget, 4, delta);
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={AMBIENT_INTENSITY} color="#fff1dc" />
      <spotLight
        ref={spotRef}
        position={[0, 14, 7]}
        angle={0.42}
        penumbra={0.9}
        intensity={SPOT_INTENSITY}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-6, 4, -8]} intensity={0.6} color="#ffd9a8" />
    </>
  );
}

function ContextLossWatcher({ onContextLost }: { onContextLost(): void }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = () => onContextLost();
    canvas.addEventListener("webglcontextlost", handleLost);
    return () => canvas.removeEventListener("webglcontextlost", handleLost);
  }, [gl, onContextLost]);

  return null;
}

/**
 * The stage turns inert under an open panel, so the canvas never sees the pointer leave a hovered key and the
 * pointer cursor would stick over the panel. End the hover the way a real pointerleave would.
 */
function HoverReset({ panelOpen }: { panelOpen: boolean }) {
  const events = useThree((state) => state.events);

  useEffect(() => {
    if (panelOpen) events.handlers?.onPointerLeave(new PointerEvent("pointerleave"));
  }, [panelOpen, events]);

  return null;
}

export default function KeyboardScene({ panelOpen, paused, onContextLost, ...modelProps }: KeyboardSceneProps) {
  return (
    <div className="keyboard-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        shadows="percentage"
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: CAMERA_FOV, near: 0.1, far: 100 }}
        // Nothing moves on its own under reduced motion, so render only when something changes.
        frameloop={paused || modelProps.reducedMotion ? "demand" : "always"}
      >
        <Lights panelOpen={panelOpen} reducedMotion={modelProps.reducedMotion} />
        <CameraRig panelOpen={panelOpen} reducedMotion={modelProps.reducedMotion} />
        <KeyboardModel {...modelProps} />
        <mesh rotation-x={-Math.PI / 2} position-y={-0.55} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
        <ContextLossWatcher onContextLost={onContextLost} />
        <HoverReset panelOpen={panelOpen} />
      </Canvas>
    </div>
  );
}
