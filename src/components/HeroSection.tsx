"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import hero from "../assets/user.png";

const HeroSection = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0d1f12] via-[#1a3b2a] to-[#0D4715] flex items-center justify-center">
      <div className="absolute inset-0 bg-[url('/matrix-pattern.svg')] opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8"
            >
              <code className="text-[#50fa7b] font-mono">~$ whoami</code>
            </motion.div>

            <h1 className="text-6xl lg:text-8xl font-bold text-[#c3e9d0] mb-6 font-heading">
              <span className="text-[#50fa7b]">&gt;</span> Kaan
            </h1>

            <p className="text-lg lg:text-xl text-[#88c999] max-w-[600px] mx-auto lg:mx-0 mb-8 font-mono">
              {"//"} Building user-friendly mobile applications
            </p>

            <button className="bg-[#50fa7b] text-[#0d1f12] px-8 py-3 rounded-md font-medium hover:bg-[#3ecf6a] transition-colors duration-300 font-mono">
              view_projects.js
            </button>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-[350px] h-[350px] bg-[#0d1f12] rounded-xl border-2 border-[#50fa7b]/30 p-2 shadow-2xl">
              <div className="absolute inset-0 bg-green-900/10 rounded-xl" />
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src={hero}
                  alt="Profile"
                  layout="fill"
                  objectFit="cover"
                  className="grayscale hover:grayscale-0 transition-all"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-[#50fa7b]/10 p-3 text-center">
                <code className="text-[#50fa7b] text-sm font-mono">
                  user@portfolio:~
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blinking cursor */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-[#50fa7b] rounded-full flex justify-center">
          <div className="w-1 h-2 bg-[#50fa7b] mt-2 rounded-full animate-scroll"></div>
        </div>
      </div>
    </div>
  );
};
export default HeroSection;
