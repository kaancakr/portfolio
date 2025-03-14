"use client";
import { motion } from "framer-motion";
import { FiGithub, FiLinkedin, FiMail, FiTerminal } from "react-icons/fi";

export const Footer = () => {
  return (
    <footer className="bg-[#0d1f12] py-12 border-t border-[#50fa7b]/20 font-mono">
      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mb-8"
        >
          <FiTerminal className="text-[#50fa7b] mx-auto mb-4" size={28} />
          <h3 className="text-[#c3e9d0] text-lg mb-4">$ connect_with_me</h3>
        </motion.div>

        <div className="flex justify-center space-x-6 mb-8">
          {[
            { icon: FiGithub, link: "#" },
            { icon: FiLinkedin, link: "#" },
            { icon: FiMail, link: "#" },
          ].map((item, index) => (
            <motion.a
              key={index}
              href={item.link}
              whileHover={{ y: -3 }}
              className="text-[#50fa7b] hover:text-[#3ecf6a] transition-colors"
            >
              <item.icon size={24} />
            </motion.a>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-[#88c999] text-sm"
        >
          Designed & Built by Kaan © {new Date().getFullYear()}
          <br />
          <span className="text-[#50fa7b]">$</span> All rights reserved
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-8 flex justify-center items-center gap-2 text-[#88c999] text-sm"
        >
          <span className="animate-pulse">■</span>
          <span>Connected</span>
        </motion.div>
      </div>
    </footer>
  );
};
