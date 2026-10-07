"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { IconType } from "react-icons";
import { FiBriefcase, FiDownload, FiFolder, FiGithub, FiMail, FiSend, FiUser, FiX } from "react-icons/fi";
import { ACTIONS, SECTIONS } from "@/components/keyboard/layout";
import type { ActionId, SectionId } from "@/components/keyboard/layout";
import type { HighlightTarget } from "@/components/keyboard/KeyboardModel";

const SECTION_ICONS: Record<SectionId, IconType> = {
  about: FiUser,
  experience: FiBriefcase,
  projects: FiFolder,
  contact: FiSend,
};
const ACTION_ICONS: Record<ActionId, IconType> = { cv: FiDownload, github: FiGithub, mail: FiMail };
const ACTION_IDS = Object.keys(ACTIONS) as ActionId[];
const CLOCK_FORMAT = new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });
const CLOCK_TICK_MS = 15_000;

/** The page's greeting; it sits on the desktop wallpaper when the monitor shows content, else above the keyboard. */
export function IntroHeading() {
  return (
    <>
      <div className="eyebrow">Software Engineer · Ankara, Türkiye</div>
      <h1 className="stage-title">
        Hi, I&apos;m <span>Kaan.</span>
      </h1>
    </>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return <time dateTime={now.toISOString()}>{CLOCK_FORMAT.format(now)}</time>;
}

interface DesktopWindowProps {
  title: string;
  reducedMotion: boolean;
  onClose(): void;
  children: ReactNode;
}

function DesktopWindow({ title, reducedMotion, onClose, children }: DesktopWindowProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Focus the scrolling body so arrow keys, Page Down and Space read through the content.
  useEffect(() => {
    bodyRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.div
      className="desktop-window"
      role="dialog"
      aria-label={title}
      initial={{ opacity: 0, scale: 0.96, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
    >
      <div className="desktop-window-bar">
        <button type="button" className="window-dot window-close" aria-label={`Close ${title}`} onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
        <span className="window-dot" aria-hidden="true" />
        <span className="window-dot" aria-hidden="true" />
        <span className="desktop-window-title">{title}</span>
      </div>
      <div ref={bodyRef} className="desktop-window-body" tabIndex={-1}>
        {children}
      </div>
    </motion.div>
  );
}

export interface DesktopProps {
  sections: Record<SectionId, ReactNode>;
  activeSection: SectionId | null;
  /** False on narrow screens, where the desktop is only scenery and sections open in the page's panels. */
  interactive: boolean;
  reducedMotion: boolean;
  onOpenSection(id: SectionId): void;
  onCloseSection(): void;
  onHoverChange(target: HighlightTarget | null): void;
}

/** The monitor's screen: a menu bar, one icon per section, the greeting, and the open section's window. */
export function Desktop({
  sections,
  activeSection,
  interactive,
  reducedMotion,
  onOpenSection,
  onCloseSection,
  onHoverChange,
}: DesktopProps) {
  const activeTitle = SECTIONS.find((section) => section.id === activeSection)?.label;

  return (
    <div className={`desktop${reducedMotion ? "" : " desktop-boot"}`} inert={!interactive}>
      <div className="desktop-menubar">
        <span className="desktop-brand">kaan.os</span>
        <div className="desktop-menubar-items">
          {ACTION_IDS.map((id) => {
            const action = ACTIONS[id];
            const Icon = ACTION_ICONS[id];
            return (
              <a
                key={id}
                href={action.href}
                download={action.download}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noreferrer" : undefined}
                onMouseEnter={() => onHoverChange({ kind: "action", id })}
                onMouseLeave={() => onHoverChange(null)}
                onFocus={() => onHoverChange({ kind: "action", id })}
                onBlur={() => onHoverChange(null)}
              >
                <Icon aria-hidden="true" />
                {action.label}
              </a>
            );
          })}
          <Clock />
        </div>
      </div>
      <div className="desktop-area">
        <nav className="desktop-icons" aria-label="Desktop">
          {SECTIONS.map((section) => {
            const Icon = SECTION_ICONS[section.id];
            return (
              <button
                key={section.id}
                type="button"
                className={`desktop-icon${activeSection === section.id ? " is-active" : ""}`}
                aria-current={activeSection === section.id ? "true" : undefined}
                onClick={() => onOpenSection(section.id)}
                onMouseEnter={() => onHoverChange({ kind: "section", id: section.id })}
                onMouseLeave={() => onHoverChange(null)}
                onFocus={() => onHoverChange({ kind: "section", id: section.id })}
                onBlur={() => onHoverChange(null)}
              >
                <span className="desktop-icon-glyph" aria-hidden="true">
                  <Icon />
                </span>
                {section.label}
              </button>
            );
          })}
        </nav>
        {interactive && (
          <header className="desktop-hero">
            <IntroHeading />
          </header>
        )}
        <AnimatePresence mode="wait">
          {interactive && activeSection && activeTitle && (
            <DesktopWindow key={activeSection} title={activeTitle} reducedMotion={reducedMotion} onClose={onCloseSection}>
              {sections[activeSection]}
            </DesktopWindow>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
