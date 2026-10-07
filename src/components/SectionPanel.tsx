"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import type { SectionId } from "@/components/keyboard/layout";

export interface SectionPanelProps {
  id: SectionId;
  title: string;
  open: boolean;
  reducedMotion: boolean;
  onClose(): void;
  onSettledChange(settledOpen: boolean): void;
  children: ReactNode;
}

const INSTANT = { duration: 0 };
// Opening springs in; closing is a short tween so the panel is hidden (out of the tab order) quickly.
const VARIANTS = {
  open: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 30 } },
  closed: { y: "100%", opacity: 0, transition: { duration: 0.32, ease: "easeIn" } },
};
const REDUCED_VARIANTS = {
  open: { y: 0, opacity: 1, transition: INSTANT },
  closed: { y: "100%", opacity: 0, transition: INSTANT },
};

export function SectionPanel({ id, title, open, reducedMotion, onClose, onSettledChange, children }: SectionPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(open);
  // Stays true through the close animation so the panel slides out before it is hidden.
  const [visible, setVisible] = useState(open);
  if (open && !visible) setVisible(true);

  useEffect(() => {
    if (open) panelRef.current?.focus({ preventScroll: true });
    else if (wasOpen.current) onSettledChange(false);
    wasOpen.current = open;
  }, [open, onSettledChange]);

  return (
    <motion.div
      ref={panelRef}
      id={`panel-${id}`}
      className="panel"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      hidden={!visible}
      initial={false}
      variants={reducedMotion ? REDUCED_VARIANTS : VARIANTS}
      animate={open ? "open" : "closed"}
      onAnimationComplete={(definition) => {
        if (definition === "open") onSettledChange(true);
        else if (definition === "closed") setVisible(false);
      }}
    >
      <div className="panel-header">
        <button type="button" className="panel-close" aria-label={`Close ${title}`} onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
      </div>
      <div className="panel-body">{children}</div>
    </motion.div>
  );
}
