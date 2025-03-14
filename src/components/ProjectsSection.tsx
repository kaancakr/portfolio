"use client";
import { motion } from "framer-motion";
import { FiCode } from "react-icons/fi";

const projects = [
  {
    title: "Fitness Tracker App",
    tech: ["React Native", "Firebase", "Node.js"],
    description: "Cross-platform fitness application with real-time tracking",
    link: "#",
  },
  {
    title: "E-Commerce Platform",
    tech: ["Flutter", "Stripe", "MongoDB"],
    description: "Mobile shopping experience with payment integration",
    link: "#",
  },
];

export const ProjectsSection = () => {
  return (
    <section id="projects" className="py-20 bg-[#12372A] relative font-mono">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-[#50fa7b] mb-12">
            $ featured_projects
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="bg-[#1a2e21] p-6 rounded-lg border border-[#50fa7b]/20 hover:border-[#50fa7b]/50 transition-all duration-300"
              >
                <div className="mb-4">
                  <FiCode className="text-[#50fa7b]" size={28} />
                </div>
                <h3 className="text-2xl text-[#c3e9d0] mb-2">
                  &gt; {project.title}
                </h3>
                <p className="text-[#88c999] mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((t, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm bg-[#50fa7b]/10 text-[#50fa7b] rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <a
                  href={project.link}
                  className="text-[#50fa7b] hover:text-[#3ecf6a] flex items-center gap-2"
                >
                  $ view_project →
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
