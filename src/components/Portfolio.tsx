"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { FiVolume2, FiVolumeX } from "react-icons/fi";
import { ACTIONS, SECTIONS, keysForSection } from "@/components/keyboard/layout";
import type { ActionId, KeyDef, SectionId } from "@/components/keyboard/layout";
import type { HighlightTarget, PressSignal } from "@/components/keyboard/KeyboardModel";
import { parseSectionHash, sectionHash } from "@/components/keyboard/hash";
import {
  INITIAL_TYPING,
  advanceTyping,
  isNavigationKeystroke,
  keyForTypedLetter,
  typedLetter,
} from "@/components/keyboard/typing";
import type { TypingMatch, TypingState } from "@/components/keyboard/typing";
import { performAction } from "@/components/keyboard/actions";
import { primeSound, setSoundMuted } from "@/components/keyboard/sound";
import { SectionPanel } from "@/components/SectionPanel";
import { FlatKeyboard } from "@/components/keyboard/FlatKeyboard";
import { KeyboardBoundary } from "@/components/keyboard/KeyboardBoundary";
import { isWebGLAvailable } from "@/components/keyboard/webgl";

const KeyboardScene = dynamic(() => import("@/components/keyboard/KeyboardScene"), {
  ssr: false,
  loading: () => <div className="keyboard-canvas" />,
});

const IDLE_HINT = "Hover a word · press to open · or just type it";
const NO_PRESSES: PressSignal = { nonce: 0, presses: [] };
const RIPPLE_STEP_MS = 35;
const OPEN_AFTER_RIPPLE_MS = 120;
const TYPING_IDLE_RESET_MS = 2000;
// Marks history entries this page pushed, so closing can go back instead of stacking entries.
interface PanelHistoryState {
  portfolioPanel: true;
}
const ACTION_IDS = Object.keys(ACTIONS) as ActionId[];
const ACTION_SUFFIX: Record<ActionId, string> = { cv: " ↓", github: " ↗", mail: "" };

function hintFor(highlight: HighlightTarget | null): string {
  if (!highlight) return IDLE_HINT;
  const label =
    highlight.kind === "section"
      ? SECTIONS.find((section) => section.id === highlight.id)!.label
      : ACTIONS[highlight.id].label;
  return `Open ${label} ↵`;
}

function pick({ key, ctrlKey, metaKey, altKey, repeat }: KeyboardEvent) {
  return { key, ctrlKey, metaKey, altKey, repeat };
}

function wordFor(id: SectionId): string {
  return SECTIONS.find((section) => section.id === id)!.word;
}

type KeyboardMode = "checking" | "3d" | "flat";

/** Fades with the panel; while fading out it lets clicks through to the keyboard instead of swallowing them. */
function PanelBackdrop({ reducedMotion, onClose }: { reducedMotion: boolean; onClose(): void }) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      className="panel-backdrop"
      aria-hidden="true"
      style={{ pointerEvents: isPresent ? "auto" : "none" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.25 }}
      onClick={onClose}
    />
  );
}

export function Portfolio({ sections }: { sections: Record<SectionId, ReactNode> }) {
  const reducedMotion = useReducedMotion() ?? false;
  const [highlight, setHighlight] = useState<HighlightTarget | null>(null);
  const [pressSignal, setPressSignal] = useState<PressSignal>(NO_PRESSES);
  const [muted, setMuted] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [panelSettled, setPanelSettled] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("checking");
  const [typedMatch, setTypedMatch] = useState<TypingMatch | null>(null);
  const pendingOpenRef = useRef<number | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const typingRef = useRef<TypingState>(INITIAL_TYPING);
  const typingIdleRef = useRef<number | null>(null);
  // Panel entries keep their marker across a reload, but going back from one then leaves this document
  // (a full reload and intro replay), so only go back over entries pushed since this page loaded.
  const pushedPanelEntryRef = useRef(false);

  const handleHoverChange = useCallback((target: HighlightTarget | null) => setHighlight(target), []);
  const clearHighlight = useCallback(() => setHighlight(null), []);

  const emitPress = useCallback((presses: PressSignal["presses"]) => {
    setPressSignal((previous) => ({ nonce: previous.nonce + 1, presses }));
  }, []);

  const rippleFor = useCallback(
    (id: SectionId): PressSignal["presses"] =>
      keysForSection(id).map((key, index) => ({ keyId: key.id, delayMs: reducedMotion ? 0 : index * RIPPLE_STEP_MS })),
    [reducedMotion],
  );

  const cancelPendingOpen = useCallback(() => {
    if (pendingOpenRef.current === null) return false;
    window.clearTimeout(pendingOpenRef.current);
    pendingOpenRef.current = null;
    return true;
  }, []);

  const openSection = useCallback(
    (id: SectionId, { ripple = true }: { ripple?: boolean } = {}) => {
      if (activeSection !== null || pendingOpenRef.current !== null) return;
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setHighlight({ kind: "section", id });
      if (ripple) emitPress(rippleFor(id));
      const delay = reducedMotion ? 0 : wordFor(id).length * RIPPLE_STEP_MS + OPEN_AFTER_RIPPLE_MS;
      pendingOpenRef.current = window.setTimeout(() => {
        pendingOpenRef.current = null;
        setPanelSettled(false);
        setActiveSection(id);
        setHighlight(null);
        // Next's patched pushState writes its router state into the object it is given, so each push needs a fresh one.
        window.history.pushState({ portfolioPanel: true } satisfies PanelHistoryState, "", sectionHash(id));
        pushedPanelEntryRef.current = true;
      }, delay);
    },
    [activeSection, emitPress, rippleFor, reducedMotion],
  );

  const closeSection = useCallback(() => {
    if (cancelPendingOpen()) {
      returnFocusRef.current = null;
      setHighlight(null);
      return;
    }
    if (activeSection === null) return;
    setActiveSection(null);
    const historyState = window.history.state as Partial<PanelHistoryState> | null;
    if (pushedPanelEntryRef.current && historyState?.portfolioPanel) {
      window.history.back();
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [activeSection, cancelPendingOpen]);

  // Pressing a key only animates it; the section or action runs on click (release over the same key),
  // so dragging off a key cancels, and touch taps carry the user activation popups and audio need.
  const handleKeyPointerDown = useCallback(
    (key: KeyDef) => {
      primeSound();
      if (activeSection !== null || pendingOpenRef.current !== null) return;
      if (key.kind === "word" && key.section) emitPress(rippleFor(key.section));
      else emitPress([{ keyId: key.id, delayMs: 0 }]);
    },
    [activeSection, emitPress, rippleFor],
  );

  const handleKeyClick = useCallback(
    (key: KeyDef) => {
      if (key.kind === "word" && key.section) openSection(key.section, { ripple: false });
      else if (key.kind === "action" && key.action) performAction(key.action);
    },
    [openSection],
  );

  useEffect(() => {
    setKeyboardMode(isWebGLAvailable() ? "3d" : "flat");
  }, []);

  // Safari only unlocks audio inside a user gesture. Prime on every click and keydown, before any handler runs,
  // so the nav, the flat keyboard and typing unlock it too, not just the 3D keys.
  useEffect(() => {
    const options = { capture: true };
    window.addEventListener("click", primeSound, options);
    window.addEventListener("keydown", primeSound, options);
    return () => {
      window.removeEventListener("click", primeSound, options);
      window.removeEventListener("keydown", primeSound, options);
    };
  }, []);

  const handleContextLost = useCallback(() => {
    console.warn("WebGL context lost; switching to the 2D keyboard.");
    setKeyboardMode("flat");
  }, []);

  // Open the panel named in the URL on load, and follow Back/Forward afterwards.
  useEffect(() => {
    const initial = parseSectionHash(window.location.hash);
    if (initial) setActiveSection(initial);
    const handlePopState = () => {
      cancelPendingOpen();
      setPanelSettled(false);
      setActiveSection(parseSectionHash(window.location.hash));
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      cancelPendingOpen();
    };
  }, [cancelPendingOpen]);

  // The stage is inert while a panel is open, so focus can only return once it has closed.
  useEffect(() => {
    if (activeSection !== null) return;
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target?.isConnected) target.focus();
  }, [activeSection]);

  const resetTyping = useCallback(() => {
    if (typingIdleRef.current !== null) window.clearTimeout(typingIdleRef.current);
    typingIdleRef.current = null;
    typingRef.current = INITIAL_TYPING;
    setTypedMatch(null);
  }, []);

  useEffect(() => resetTyping, [resetTyping]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!isNavigationKeystroke({ ...pick(event), target })) return;
      if (event.key === "Escape") {
        emitPress([{ keyId: "esc", delayMs: 0 }]);
        closeSection();
        resetTyping();
        return;
      }
      if (activeSection !== null || pendingOpenRef.current !== null) return;

      // Enter opens whatever the hint names; a focused link or button handles its own Enter.
      if (event.key === "Enter" && highlight && !target?.closest("a, button")) {
        resetTyping();
        if (highlight.kind === "section") {
          openSection(highlight.id);
        } else {
          emitPress([{ keyId: highlight.id, delayMs: 0 }]);
          performAction(highlight.id);
        }
        return;
      }

      if (event.key === " ") emitPress([{ keyId: "space", delayMs: 0 }]);
      const result = advanceTyping(typingRef.current, event.key);
      typingRef.current = result.state;
      setTypedMatch(result.open ? null : result.match);
      const letter = typedLetter(event.key);
      if (letter) {
        const key = keyForTypedLetter(letter, result.match);
        if (key) emitPress([{ keyId: key.id, delayMs: 0 }]);
      }
      if (result.open) {
        resetTyping();
        openSection(result.open, { ripple: false });
        return;
      }
      if (typingIdleRef.current !== null) window.clearTimeout(typingIdleRef.current);
      typingIdleRef.current = window.setTimeout(resetTyping, TYPING_IDLE_RESET_MS);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSection, closeSection, emitPress, highlight, openSection, resetTyping]);

  const toggleMuted = () => {
    const next = !muted;
    setSoundMuted(next);
    setMuted(next);
  };

  const panelOpen = activeSection !== null;
  const flatKeyboard = (
    <FlatKeyboard
      highlight={highlight}
      onHoverChange={handleHoverChange}
      onActivateSection={openSection}
      onActivateAction={performAction}
    />
  );

  return (
    <>
      <main className="stage" inert={panelOpen}>
        <button
          type="button"
          className="mute-toggle"
          aria-pressed={muted}
          aria-label="Mute key sounds"
          onClick={toggleMuted}
        >
          {muted ? <FiVolumeX aria-hidden="true" /> : <FiVolume2 aria-hidden="true" />}
        </button>
        <header className="stage-intro">
          <div className="eyebrow">Software Engineer · Ankara, Türkiye</div>
          <h1 className="stage-title">
            Hi, I&apos;m <span>Kaan.</span>
          </h1>
          <p className="stage-hint">{hintFor(highlight)}</p>
        </header>
        {keyboardMode === "checking" && <div className="keyboard-canvas" />}
        {keyboardMode === "3d" && (
          <KeyboardBoundary fallback={flatKeyboard}>
            <KeyboardScene
              highlight={highlight}
              typedMatch={typedMatch}
              pressSignal={pressSignal}
              reducedMotion={reducedMotion}
              panelOpen={panelOpen}
              paused={panelOpen && panelSettled}
              onHoverChange={handleHoverChange}
              onKeyPointerDown={handleKeyPointerDown}
              onKeyClick={handleKeyClick}
              onContextLost={handleContextLost}
            />
          </KeyboardBoundary>
        )}
        {keyboardMode === "flat" && flatKeyboard}
        <nav aria-label="Sections" className="keyboard-nav">
          <div className="keyboard-nav-group">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => openSection(section.id)}
                onMouseEnter={() => setHighlight({ kind: "section", id: section.id })}
                onMouseLeave={clearHighlight}
                onFocus={() => setHighlight({ kind: "section", id: section.id })}
                onBlur={clearHighlight}
              >
                {section.label}
              </button>
            ))}
          </div>
          <span className="keyboard-nav-divider" aria-hidden="true" />
          <div className="keyboard-nav-group">
            {ACTION_IDS.map((id) => {
              const action = ACTIONS[id];
              return (
                <a
                  key={id}
                  href={action.href}
                  download={action.download}
                  target={action.external ? "_blank" : undefined}
                  rel={action.external ? "noreferrer" : undefined}
                  onMouseEnter={() => setHighlight({ kind: "action", id })}
                  onMouseLeave={clearHighlight}
                  onFocus={() => setHighlight({ kind: "action", id })}
                  onBlur={clearHighlight}
                >
                  {action.label}
                  {ACTION_SUFFIX[id] && <span aria-hidden="true">{ACTION_SUFFIX[id]}</span>}
                </a>
              );
            })}
          </div>
        </nav>
      </main>
      <AnimatePresence>
        {panelOpen && <PanelBackdrop key="panel-backdrop" reducedMotion={reducedMotion} onClose={closeSection} />}
      </AnimatePresence>
      {SECTIONS.map((section) => (
        <SectionPanel
          key={section.id}
          id={section.id}
          title={section.label}
          open={activeSection === section.id}
          reducedMotion={reducedMotion}
          onClose={closeSection}
          onSettledChange={setPanelSettled}
        >
          {sections[section.id]}
        </SectionPanel>
      ))}
    </>
  );
}
