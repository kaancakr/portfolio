const skillGroups = [
  { title: "Frontend", skills: ["TypeScript", "React", "Next.js", "React Native", "Tailwind CSS"] },
  { title: "Backend", skills: ["Python", "Django", "FastAPI", "Spring Boot", "Node.js"] },
  { title: "Platform & Security", skills: ["API Security", "OpenAPI", "Kafka", "PostgreSQL", "Docker", "Redis", "WebSockets"] },
];

export const AboutSection = () => (
  <section id="about" className="section">
    <div className="page-shell">
      <div className="eyebrow">01 / About</div>
      <h2 className="section-heading">Engineering with<br />a product mindset.</h2>
      <div className="about-grid">
        <div className="about-copy">
          <p>I hold a B.S. in Software Engineering from TED University, with a secondary field in Applied Data Analytics. Since February 2025, I&apos;ve been building API security products as a Software Engineer at ApyGuard.</p>
          <p>I&apos;m interested in turning security analysis into scalable products, building real-time data systems, and creating tools that make developers&apos; work easier.</p>
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
