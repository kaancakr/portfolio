"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";

const navLinks = [
  { name: "About", path: "#about" },
  { name: "Experience", path: "#experience" },
  { name: "Projects", path: "#projects" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link href="#home" className="brand" onClick={() => setIsOpen(false)}>
          <span className="brand-mark">K</span>
          <span>Kaan Çakır</span>
        </Link>
        <div className={`nav-links${isOpen ? " is-open" : ""}`}>
          {navLinks.map((link) => (
            <Link key={link.path} href={link.path} onClick={() => setIsOpen(false)}>
              {link.name}
            </Link>
          ))}
          <Link href="#contact" className="nav-cta" onClick={() => setIsOpen(false)}>
            Get in touch <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <button
          type="button"
          className="menu-button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>
    </nav>
  );
}
