"use client";
import { motion } from "framer-motion";
import { FiBriefcase, FiCalendar, FiArrowUpRight } from "react-icons/fi";

const experiences = [
  {
    company: "ASELSAN",
    role: "Software Engineer Intern",
    duration: "2024 August - 2024 September",
    description: [
      "Developed Sensor Tracker Website using React & NextJS",
      "Created Sensor Simulator with C# & .NET",
      "Implemented Web Socket communication with Spring Boot",
      "Worked with Kafka for live data streaming",
      "Managed database operations using PostgreSQL",
    ],
  },
  {
    company: "Ankara Science University",
    role: "Academic Researcher & Mobile Developer",
    duration: "2024 February - 2024 October",
    description: [
      "Developed ABU App & ABU Assistant Mobile Applications using React Native",
      "Built ABU Assistant Website with React & NextJS",
      "Implemented UI/UX designs using JavaScript & TypeScript",
      "Created API-Chatbot Interactions",
      "Test management",
      "Store deployments"
    ],
  },
  {
    company: "Optima Soft",
    role: "Software Engineer Intern",
    duration: "2023 June - 2023 September",
    description: [
      "Developed Optima ALPR App using React Native",
      "Implemented UI/UX designs with JavaScript & TypeScript",
      "Integrated API services for license plate recognition",
      "Managed iOS/Android build processes",
      "Contributed to performance optimization efforts",
    ],
  },
];

export const ExperienceSection = () => {
  return (
    <section id="experience" className="py-20 bg-[#0d1f12] relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-[#50fa7b] mb-12 font-heading">
            &lt;Experience/&gt;
          </h2>

          <div className="space-y-12 relative before:absolute before:left-8 before:h-full before:w-1 before:bg-green-900/50">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="relative pl-24 group"
              >
                <div className="absolute left-0.5 top-2 w-16 h-16 bg-[#50fa7b]/10 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#50fa7b] rounded-full"></div>
                </div>

                <div className="bg-[#1a2e21] p-8 rounded-xl shadow-xl border border-green-900/30 hover:border-[#50fa7b]/30 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <FiBriefcase className="text-[#50fa7b]" size={24} />
                    <h3 className="text-2xl text-[#c3e9d0] font-medium">
                      {exp.role}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <span className="px-3 py-1 bg-[#50fa7b]/10 text-[#50fa7b] rounded-full text-sm">
                      {exp.company}
                    </span>
                    <div className="flex items-center gap-2 text-green-600">
                      <FiCalendar />
                      <span>{exp.duration}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {exp.description.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[#88c999]"
                      >
                        <FiArrowUpRight className="text-[#50fa7b] mt-1 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
