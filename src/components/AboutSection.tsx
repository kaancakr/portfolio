const skillGroups = [
  { title: "Frontend", skills: ["TypeScript", "React", "Next.js", "React Native", "Tailwind CSS"] },
  { title: "Backend", skills: ["Python", "Django", "FastAPI", "Spring Boot", "Node.js"] },
  { title: "Platform & Security", skills: ["API Security", "OpenAPI", "Kafka", "PostgreSQL", "Docker", "Redis", "WebSockets"] },
];

export const AboutSection = () => (
  <section id="about" className="section">
    <div className="page-shell">
      <div className="eyebrow">01 / About</div>
      <h2 className="section-heading">Building secure products,<br />end to end.</h2>
      <div className="about-grid">
        <div className="about-copy">
          <p>I&apos;m Kaan, a Software Engineer working across the full stack at ApyGuard, where I have contributed to the company&apos;s API security platform since February 2025. I build Next.js interfaces for API discovery, OpenAPI analysis, and runtime monitoring, and develop Django services for real-time vulnerability analysis and behavioral profiling, supported by Kafka-based telemetry streaming.</p>
          <p>I enjoy owning features from the data layer to the user interface, and turning complex security analysis into products that are reliable, scalable, and easy to use.</p>
          <p>I hold a B.S. in Software Engineering from TED University, with a secondary field in Applied Data Analytics. Before ApyGuard, I built real-time systems at ASELSAN and React Native applications at Ankara Science University and Optima Soft.</p>
        </div>
        <div className="skill-groups">
          {skillGroups.map((group) => (
            <div className="skill-group" key={group.title}>
              <h3>{group.title}</h3>
              <div className="skill-list">
                {group.skills.map((skill) => <span className="skill-chip" key={skill}>{skill}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
