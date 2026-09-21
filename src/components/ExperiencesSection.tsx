const experiences = [
  {
    company: "ApyGuard",
    role: "Software Engineer",
    duration: "Feb 2025 — Present",
    points: [
      "Develop API security features for real-time vulnerability analysis and behavioral profiling using Next.js and Django.",
      "Build interfaces for API discovery, OpenAPI analysis, and runtime monitoring workflows.",
      "Contribute to Kafka-based event streaming for scalable API telemetry and internal tools for OWASP API Security Top 10 detection.",
    ],
  },
  {
    company: "Ankara Science University",
    role: "Academic Researcher & Mobile Developer",
    duration: "Feb 2024 — Oct 2024",
    points: [
      "Developed React Native applications for academic assistant and communication platforms.",
      "Built Next.js interfaces integrated with real-time chat and cloud services, and managed iOS and Android releases.",
    ],
  },
  {
    company: "ASELSAN",
    role: "Software Engineer Intern",
    duration: "Aug 2024 — Sep 2024",
    points: [
      "Built real-time sensor tracking interfaces with React and Next.js for operational visualization.",
      "Developed telemetry simulators with C# and .NET to test distributed sensor communication.",
      "Implemented WebSocket and Kafka streams for low-latency communication and used PostgreSQL for telemetry storage.",
    ],
  },
  {
    company: "Optima Soft",
    role: "Software Engineer Intern",
    duration: "Jun 2023 — Sep 2023",
    points: [
      "Contributed to React Native applications for ALPR workflows.",
      "Built reusable UI components with TypeScript and integrated backend APIs.",
    ],
  },
];

export const ExperienceSection = () => (
  <section id="experience" className="section">
    <div className="page-shell">
      <div className="eyebrow">02 / Experience</div>
      <h2 className="section-heading">Where I&apos;ve built<br />and shipped products.</h2>
      <div className="experience-list">
        {experiences.map((experience) => (
          <article className="experience-item" key={experience.company}>
            <div className="experience-date">{experience.duration}</div>
            <span className="experience-marker" aria-hidden="true" />
            <div className="experience-card">
              <div className="experience-top">
                <div>
                  <h3 className="experience-role">{experience.role}</h3>
                  <div className="experience-company">{experience.company}</div>
                </div>
              </div>
              <ul className="experience-points">
                {experience.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
