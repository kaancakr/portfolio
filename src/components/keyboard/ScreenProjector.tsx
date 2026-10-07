"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { screenResolution } from "@/components/keyboard/camera";
import { SCREEN_CENTER, SCREEN_SIZE, SCREEN_TILT_DEG } from "@/components/keyboard/monitor";

export interface ScreenProjectorProps {
  /** The desktop's root element; React renders into it through a portal. */
  element: HTMLElement;
  /** Element stacked over the canvas that holds the CSS 3D layer. */
  layer: HTMLElement;
}

/**
 * Projects a DOM element onto the monitor's screen with CSS 3D transforms, so the desktop stays real,
 * clickable, scrollable HTML. The CSS layer is drawn over the canvas, so the scene keeps the keyboard
 * out from under the screen in every camera pose.
 */
export function ScreenProjector({ element, layer }: ScreenProjectorProps) {
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);

  const css = useMemo(() => {
    const renderer = new CSS3DRenderer();
    // Only the screen itself takes the pointer; everywhere else it reaches the keyboard canvas below.
    renderer.domElement.style.pointerEvents = "none";
    // Focusing a link on the screen must not scroll the layer and shift it off the monitor.
    renderer.domElement.style.overflow = "clip";
    const object = new CSS3DObject(element);
    object.position.set(SCREEN_CENTER.x, SCREEN_CENTER.y, SCREEN_CENTER.z);
    object.rotation.x = -THREE.MathUtils.degToRad(SCREEN_TILT_DEG);
    return { renderer, scene: new THREE.Scene(), object };
  }, [element]);

  useEffect(() => {
    layer.append(css.renderer.domElement);
    css.scene.add(css.object);
    return () => {
      // Removing the object also detaches the element from the layer.
      css.scene.remove(css.object);
      css.renderer.domElement.remove();
    };
  }, [css, layer]);

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    const resolution = screenResolution(size.width, size.height);
    element.style.width = `${resolution.width}px`;
    element.style.height = `${resolution.height}px`;
    css.object.scale.setScalar(SCREEN_SIZE.width / resolution.width);
    css.renderer.setSize(size.width, size.height);
    invalidate();
  }, [css, element, size.width, size.height, invalidate]);

  // A positive priority takes over rendering, so both layers draw after the camera rig has moved this frame.
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
    css.renderer.render(css.scene, camera);
  }, 1);

  return null;
}
