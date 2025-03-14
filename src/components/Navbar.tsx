"use client";
import React, { useState } from "react";
import Link from "next/link";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { motion } from "framer-motion";

const navLinks = [
  { name: "About", path: "#about" },
  { name: "Experience", path: "#experience" },
  { name: "Contact", path: "#contact" },
];

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const [isHovered, setIsHovered] = useState<number | null>(null);

  const toggleNav = () => setNav(!nav);
  const closeNav = () => setNav(false);

  const menuVariants = {
    open: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    closed: {
      x: "-100%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-[#0d1f12]/90 backdrop-blur-md border-b border-[#50fa7b]/20 font-mono">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-[#50fa7b] hover:text-[#3ecf6a] transition-colors"
          >
            $ kaan
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                href={link.path}
                className="relative px-4 py-2 group"
                onMouseEnter={() => setIsHovered(index)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <span
                  className={`text-[#c3e9d0] transition-colors ${
                    isHovered === index ? "text-[#50fa7b]" : ""
                  }`}
                >
                  &lt;{link.name}/&gt;
                </span>
                <motion.div
                  className="absolute bottom-0 left-0 w-full h-[2px] bg-[#50fa7b]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isHovered === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            ))}
            <Link
              href="#contact"
              className="px-6 py-2 border-2 border-[#50fa7b] text-[#50fa7b] rounded-md hover:bg-[#50fa7b]/10 transition-colors duration-300"
            >
              $ hire_me
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleNav}
            className="md:hidden text-[#50fa7b] p-2 rounded-lg hover:bg-[#50fa7b]/10 transition-colors"
          >
            {nav ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        initial="closed"
        animate={nav ? "open" : "closed"}
        variants={menuVariants}
        className="fixed top-0 left-0 w-full h-screen md:hidden bg-[#0d1f12]/95 backdrop-blur-xl font-mono"
      >
        <div className="container h-full mx-auto px-6 py-4 flex flex-col items-center justify-center">
          <ul className="space-y-12 text-center">
            {navLinks.map((link, index) => (
              <motion.li
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={link.path}
                  onClick={closeNav}
                  className="text-4xl font-medium text-[#c3e9d0] hover:text-[#50fa7b] transition-colors"
                >
                  &lt;{link.name}/&gt;
                </Link>
              </motion.li>
            ))}
          </ul>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16"
          >
            <Link
              href="#contact"
              onClick={closeNav}
              className="px-8 py-3 text-lg border-2 border-[#50fa7b] text-[#50fa7b] rounded-md hover:bg-[#50fa7b]/10 transition-colors"
            >
              $ contact_me
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
