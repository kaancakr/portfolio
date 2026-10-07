"use client";

import { Component } from "react";
import type { ReactNode } from "react";

interface KeyboardBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface KeyboardBoundaryState {
  failed: boolean;
}

/** Catches WebGL creation errors and failed 3D chunk loads, and swaps in the 2D keyboard. */
export class KeyboardBoundary extends Component<KeyboardBoundaryProps, KeyboardBoundaryState> {
  state: KeyboardBoundaryState = { failed: false };

  static getDerivedStateFromError(): KeyboardBoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    // React already reports the caught error itself; this only records what the page did about it.
    console.warn("3D keyboard failed; showing the 2D keyboard instead.");
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
