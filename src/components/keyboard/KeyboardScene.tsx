"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAMERA_FOV,
  CAMERA_LOOK_AT,
  CAMERA_PARALLAX,
  KEYBOARD_EXTENT,
  PANEL_ELEVATION_DEG,
  deskPose,
  fitCameraDistance,
  screenPose,
} from "@/components/keyboard/camera";
import type { ViewPose } from "@/components/keyboard/camera";
import { KeyboardModel } from "@/components/keyboard/KeyboardModel";
import type { KeyboardModelProps } from "@/components/keyboard/KeyboardModel";
import { MonitorModel } from "@/components/keyboard/MonitorModel";
import { ScreenProjector } from "@/components/keyboard/ScreenProjector";

/** What the camera frames: the whole desk, the monitor's screen while a window is open, or the keyboard under a panel. */
export type CameraFocus = "desk" | "screen" | "panel";

export interface KeyboardSceneProps extends KeyboardModelProps {
  focus: CameraFocus;
  paused: boolean;
  /** The desktop's root element, projected onto the monitor; null until the page has created it. */
  screenElement: HTMLElement | null;
  onContextLost(): void;
}

const INTRO_ELEVATION_DEG = 70;
const PANEL_DISTANCE_FACTOR = 1.18;
const INTRO_DISTANCE_FACTOR = 1.5;
const CAMERA_DAMPING = 3;

const AMBIENT_INTENSITY = 0.45;
const SPOT_INTENSITY = 220;
const PANEL_LIGHT_FACTOR = 0.4;

interface RigState {
  distance: number;
  elevation: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  offsetX: number;
  offsetY: number;
}

function CameraRig({ focus, reducedMotion }: { focus: CameraFocus; reducedMotion: boolean }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const finePointer = useMemo(() => window.matchMedia("(pointer: fine)").matches, []);
  const rig = useRef<RigState | null>(null);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  // The fits are small numeric searches, so run them per canvas size rather than per frame.
  const poses = useMemo((): Record<CameraFocus, ViewPose> | null => {
    if (size.width === 0 || size.height === 0) return null;
    const aspect = size.width / size.height;
    const panelDistance = fitCameraDistance({
      aspect,
      fovDeg: CAMERA_FOV,
      elevationDeg: PANEL_ELEVATION_DEG,
      ...KEYBOARD_EXTENT,
    });
    return {
      desk: deskPose(aspect),
      screen: screenPose(aspect),
      panel: { lookAt: CAMERA_LOOK_AT, elevationDeg: PANEL_ELEVATION_DEG, distance: panelDistance * PANEL_DISTANCE_FACTOR },
    };
  }, [size.width, size.height]);

  // With on-demand frames, nothing else would render the camera and light change when the focus moves.
  useEffect(() => {
    invalidate();
  }, [focus, invalidate]);

  useFrame((state, delta) => {
    if (!poses) return;
    const pose = poses[focus];
    // Parallax would make text swim while reading the screen.
    const parallax = finePointer && !reducedMotion && focus !== "screen";
    const target: RigState = {
      distance: pose.distance,
      elevation: THREE.MathUtils.degToRad(pose.elevationDeg),
      lookX: pose.lookAt.x,
      lookY: pose.lookAt.y,
      lookZ: pose.lookAt.z,
      offsetX: parallax ? state.pointer.x * CAMERA_PARALLAX.x : 0,
      offsetY: parallax ? state.pointer.y * CAMERA_PARALLAX.y : 0,
    };

    if (!rig.current) {
      rig.current = reducedMotion
        ? { ...target }
        : {
            ...target,
            distance: poses.desk.distance * INTRO_DISTANCE_FACTOR,
            elevation: THREE.MathUtils.degToRad(INTRO_ELEVATION_DEG),
            offsetX: 0,
            offsetY: 0,
          };
    }
    const current = rig.current;
    if (reducedMotion) {
      Object.assign(current, target);
    } else {
      for (const key of Object.keys(target) as (keyof RigState)[]) {
        current[key] = THREE.MathUtils.damp(current[key], target[key], CAMERA_DAMPING, delta);
      }
    }

    lookAt.set(current.lookX, current.lookY, current.lookZ);
    camera.position.set(
      lookAt.x + current.offsetX,
      lookAt.y + current.distance * Math.sin(current.elevation) + current.offsetY,
      lookAt.z + current.distance * Math.cos(current.elevation),
    );
    camera.lookAt(lookAt);
  });

  return null;
}

function Lights({ dimmed, reducedMotion }: { dimmed: boolean; reducedMotion: boolean }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);

  useFrame((_, delta) => {
    const ambient = ambientRef.current;
    const spot = spotRef.current;
    if (!ambient || !spot) return;
    const factor = dimmed ? PANEL_LIGHT_FACTOR : 1;
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
function HoverReset({ stageInert }: { stageInert: boolean }) {
  const events = useThree((state) => state.events);

  useEffect(() => {
    if (stageInert) events.handlers?.onPointerLeave(new PointerEvent("pointerleave"));
  }, [stageInert, events]);

  return null;
}

export default function KeyboardScene({ focus, paused, screenElement, onContextLost, ...modelProps }: KeyboardSceneProps) {
  const [screenLayer, setScreenLayer] = useState<HTMLDivElement | null>(null);
  const panelOpen = focus === "panel";

  return (
    <div className="keyboard-canvas">
      <div className="keyboard-gl" aria-hidden="true">
        <Canvas
          dpr={[1, 2]}
          shadows="percentage"
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: CAMERA_FOV, near: 0.1, far: 200 }}
          // Nothing moves on its own under reduced motion, so render only when something changes.
          frameloop={paused || modelProps.reducedMotion ? "demand" : "always"}
        >
          <Lights dimmed={panelOpen} reducedMotion={modelProps.reducedMotion} />
          <CameraRig focus={focus} reducedMotion={modelProps.reducedMotion} />
          <KeyboardModel {...modelProps} />
          <MonitorModel />
          <mesh rotation-x={-Math.PI / 2} position-y={-0.55} receiveShadow>
            <planeGeometry args={[60, 60]} />
            <shadowMaterial opacity={0.35} />
          </mesh>
          {screenElement && screenLayer && <ScreenProjector element={screenElement} layer={screenLayer} />}
          <ContextLossWatcher onContextLost={onContextLost} />
          <HoverReset stageInert={panelOpen} />
        </Canvas>
      </div>
      <div ref={setScreenLayer} className="screen-layer" />
    </div>
  );
}
