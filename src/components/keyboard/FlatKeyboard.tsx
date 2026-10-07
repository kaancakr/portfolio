"use client";

import type { MouseEvent } from "react";
import { KEYS, SECTIONS, keysForSection } from "@/components/keyboard/layout";
import type { ActionId, SectionId } from "@/components/keyboard/layout";
import type { HighlightTarget } from "@/components/keyboard/KeyboardModel";

interface FlatKeyboardProps {
  highlight: HighlightTarget | null;
  onHoverChange(target: HighlightTarget | null): void;
  onActivateSection(id: SectionId): void;
  onActivateAction(id: ActionId): void;
}

// The flat keys live under aria-hidden (the DOM nav is the accessible path), so a click must not focus them.
const keepFocus = (event: MouseEvent) => event.preventDefault();

/** 2D stand-in for the 3D keyboard when WebGL is unavailable; the DOM nav stays the accessible path. */
export function FlatKeyboard({ highlight, onHoverChange, onActivateSection, onActivateAction }: FlatKeyboardProps) {
  return (
    <div className="keyboard-canvas flat-stage" aria-hidden="true">
      <div className="flat-keyboard">
        {SECTIONS.map((section) => {
          const row = keysForSection(section.id)[0].row;
          const actionKey = KEYS.find((key) => key.kind === "action" && key.row === row);
          const actionId = actionKey?.action;
          const wordLit = highlight?.kind === "section" && highlight.id === section.id;
          const actionLit = highlight?.kind === "action" && highlight.id === actionId;
          return (
            <div className="flat-row" key={section.id}>
              <button
                type="button"
                tabIndex={-1}
                className={`flat-word${wordLit ? " is-lit" : ""}`}
                onMouseDown={keepFocus}
                onPointerEnter={() => onHoverChange({ kind: "section", id: section.id })}
                onPointerLeave={() => onHoverChange(null)}
                onClick={() => onActivateSection(section.id)}
              >
                {[...section.word].map((letter, index) => (
                  <span className="flat-key" key={index}>
                    {letter}
                  </span>
                ))}
              </button>
              {actionKey && actionId && (
                <button
                  type="button"
                  tabIndex={-1}
                  className={`flat-key flat-key-action${actionLit ? " is-lit" : ""}`}
                  onMouseDown={keepFocus}
                  onPointerEnter={() => onHoverChange({ kind: "action", id: actionId })}
                  onPointerLeave={() => onHoverChange(null)}
                  onClick={() => onActivateAction(actionId)}
                >
                  {actionKey.legend}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
