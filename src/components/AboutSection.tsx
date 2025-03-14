"use client";
import { motion } from "framer-motion";
import { FiGithub, FiLinkedin } from "react-icons/fi";
import { TbBrandFramerMotion } from "react-icons/tb";
import { FaMobileAlt } from "react-icons/fa";

export const AboutSection = () => {
  return (
    <section
      id="about"
      className="py-20 bg-[#0d1f12] relative overflow-hidden font-mono"
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-[#50fa7b] mb-8">$ about_me</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <p className="text-[#88c999] text-lg leading-relaxed">
                Passionate mobile developer with 3+ years of experience
                Specializing in React Native & React 
                Transforming ideas into seamless digital experiences
              </p>

              <div className="flex space-x-6">
                <motion.a
                  whileHover={{ y: -3 }}
                  href="https://github.com"
                  className="text-[#50fa7b] hover:text-[#3ecf6a] transition-colors"
                >
                  <FiGithub size={24} />
                </motion.a>
                <motion.a
                  whileHover={{ y: -3 }}
                  href="https://linkedin.com"
                  className="text-[#50fa7b] hover:text-[#3ecf6a] transition-colors"
                >
                  <FiLinkedin size={24} />
                </motion.a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#1a2e21] rounded-lg">
                  <FaMobileAlt className="text-[#50fa7b]" size={24} />
                </div>
                <div>
                  <h3 className="text-[#c3e9d0] text-xl">Mobile Development</h3>
                  <p className="text-[#88c999]">$ cross-platform solutions</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#1a2e21] rounded-lg">
                  <TbBrandFramerMotion className="text-[#50fa7b]" size={24} />
                </div>
                <div>
                  <h3 className="text-[#c3e9d0] text-xl">UI/UX Design</h3>
                  <p className="text-[#88c999]">$ smooth_animations</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
