import Image from "next/image";
import { FiArrowUpRight } from "react-icons/fi";
import { withBasePath } from "@/lib/base-path";

type ProjectVisual = "abu-app" | "abu-assistant" | "optima-alpr" | "apiguard" | "openapi" | "extension";

type Project = {
  title: string;
  description: string;
  tech: string[];
  visual: ProjectVisual;
  link: { href: string; label: string } | null;
};

const projects: Project[] = [
  {
    title: "ABU App",
    description: "A mobile companion for university life, bringing class schedules, campus updates, and student tools together in one place.",
    tech: ["React Native", "iOS", "Android"],
    visual: "abu-app",
    link: null,
  },
  {
    title: "ABU Assistant",
    description: "A chat assistant and mobile experience that helps students find university information and academic support.",
    tech: ["React Native", "Next.js", "Chatbot"],
    visual: "abu-assistant",
    link: null,
  },
  {
    title: "Optima ALPR",
    description: "A mobile app for automatic license plate recognition workflows, with a focus on API integrations and cross-platform usability.",
    tech: ["React Native", "TypeScript", "ALPR"],
    visual: "optima-alpr",
    link: null,
  },
  {
    title: "ApyGuard Security Benchmarks",
    description: "Benchmark scenarios for API security testing and developer education, covering BOLA, BFLA, SSRF, mass assignment, and API misconfiguration.",
    tech: ["API Security", "OWASP", "Testing"],
    visual: "apiguard",
    link: null,
  },
  {
    title: "VS Code OpenAPI Analyzer",
    description: "A source code analyzer that extracts OpenAPI specifications from FastAPI, Flask, Express.js, and NestJS applications.",
    tech: ["TypeScript", "OpenAPI", "VS Code"],
    visual: "openapi",
    link: {
      href: "https://marketplace.visualstudio.com/items?itemName=Apyguard.apyguard-apiscout",
      label: "View on VS Code Marketplace",
    },
  },
  {
    title: "API Discovery Extension",
    description: "A Chrome extension that captures browser traffic and creates structured API documentation baselines.",
    tech: ["Chrome Extension", "API Discovery", "JavaScript"],
    visual: "extension",
    link: {
      href: "https://chromewebstore.google.com/detail/apyguard-api-discovery/ekddeahfccfhfdalbjpnnapjelgandic",
      label: "View on Chrome Web Store",
    },
  },
];

function ProjectArtwork({ visual }: { visual: ProjectVisual }) {
  if (visual === "abu-app") {
    return (
      <div className="project-visual project-visual-app">
        <Image src={withBasePath("/projects/abu-app.png")}alt="ABU App mobile screens showing the student schedule" fill sizes="(max-width: 760px) 100vw, 33vw" />
      </div>
    );
  }

  if (visual === "abu-assistant") {
    return (
      <div className="project-visual chatbot-visual" aria-label="Illustration of the ABU Assistant chat interface">
        <div className="chat-window">
          <div className="chat-topbar"><span className="chat-brand"><Image src={withBasePath("/projects/abu-assistant.png")}alt="" width={27} height={27} /> <span>ABU Assistant</span></span><span className="chat-menu">•••</span></div>
          <div className="chat-messages">
            <div className="chat-bubble chat-bubble-user">When does course registration open?</div>
            <div className="chat-bubble chat-bubble-bot"><span className="chat-bot-mark">ABU</span><span>I can help you find the registration dates and next steps.</span></div>
          </div>
          <div className="chat-input">Type your message <span>↑</span></div>
        </div>
        <div className="chat-glow" aria-hidden="true" />
      </div>
    );
  }

  if (visual === "optima-alpr") {
    return (
      <div className="project-visual alpr-visual" aria-label="Original license plate recognition interface illustration for Optima ALPR">
        <div className="alpr-window">
          <div className="alpr-toolbar"><span className="alpr-brand-mark">O</span><span>OPTIMA <i>VISION</i></span><span className="alpr-live"><b /> CANLI</span></div>
          <div className="alpr-content">
            <div className="alpr-camera">
              <div className="alpr-road" />
              <svg className="alpr-car" viewBox="0 0 260 120" role="img" aria-label="Illustration of a vehicle with a detected license plate">
                <path d="M31 74 48 54q10-12 26-15l38-9q17-4 31 6l28 21 37 6q14 2 17 14l3 18H25V84q0-7 6-10Z" fill="#202d2b" stroke="#a6b4ac" strokeWidth="2" />
                <path d="m83 46-22 27h78V43l-17-8q-8-3-19-1Z" fill="#4a635b" stroke="#91a399" strokeWidth="2" />
                <path d="m146 44 21 17-28 12V43Z" fill="#344b43" stroke="#91a399" strokeWidth="2" />
                <path d="M36 81h21m133 0h24" stroke="#c5f36b" strokeWidth="4" strokeLinecap="round" />
                <circle cx="68" cy="94" r="13" fill="#111715" stroke="#73827a" strokeWidth="3" /><circle cx="190" cy="94" r="13" fill="#111715" stroke="#73827a" strokeWidth="3" />
                <rect x="129" y="72" width="43" height="17" rx="2" fill="none" stroke="#c5f36b" strokeWidth="2" strokeDasharray="4 3" />
                <rect x="133" y="77" width="36" height="9" rx="1" fill="#e8ece4" /><text x="136" y="84" fill="#17201b" fontSize="6" fontFamily="monospace">06 ABC 241</text>
              </svg>
              <span className="alpr-camera-label">CAMERA 02 · ENTRY</span>
              <span className="alpr-detection-tag">PLATE DETECTED</span>
            </div>
            <div className="alpr-result"><span className="alpr-result-label">LATEST DETECTION</span><strong>06 ABC 241</strong><span className="alpr-confidence"><b /> Match verified</span><span className="alpr-time">Today · 14:32:08</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (visual === "apiguard") {
    return (
      <div className="project-visual code-visual security-visual" aria-label="API security analysis illustration">
        <div className="visual-panel-heading"><span className="visual-dot" /> API SECURITY SCAN <span className="visual-panel-meta">LIVE</span></div>
        <div className="security-score"><strong>04</strong><span>findings<br />detected</span><div className="security-ring">API</div></div>
        <div className="security-findings"><span><i /> BOLA <b>high</b></span><span><i /> SSRF <b>medium</b></span><span><i /> BFLA <b>high</b></span></div>
      </div>
    );
  }

  if (visual === "openapi") {
    return (
      <div className="project-visual code-visual openapi-visual" aria-label="OpenAPI source code analysis illustration">
        <div className="code-window-bar"><span /><span /><span /><label>openapi-analyzer.ts</label></div>
        <div className="code-lines"><span><i>01</i><b>const</b> spec = analyzeSource&#40;app&#41;;</span><span><i>02</i><b>detect</b>&#40;frameworks&#41;;</span><span><i>03</i><em>→</em> OpenAPI 3.1 generated</span></div>
        <div className="openapi-badge">✓ <span>4 FRAMEWORKS</span></div>
      </div>
    );
  }

  return (
    <div className="project-visual code-visual extension-visual" aria-label="Browser API discovery tool illustration">
      <div className="browser-bar"><span /><span /><span /><label>Network Inspector</label></div>
      <div className="request-row"><b>GET</b><span>/api/v1/students</span><i>200</i></div>
      <div className="request-row"><b className="request-post">POST</b><span>/api/v1/schedule</span><i>201</i></div>
      <div className="request-row"><b>GET</b><span>/api/v1/courses</span><i>200</i></div>
      <div className="extension-export"><span>◈</span> OpenAPI baseline ready <b>↓</b></div>
    </div>
  );
}

export const ProjectsSection = () => (
  <section id="projects" className="section">
    <div className="page-shell">
      <div className="eyebrow">03 / Selected work</div>
      <h2 className="section-heading">Tools, research<br />and problem solving.</h2>
      <div className="projects-grid">
        {projects.map((project, index) => (
          <article className="project-card" key={project.title}>
            <ProjectArtwork visual={project.visual} />
            <div className="project-content">
              <span className="project-index">0{index + 1} / PROJE</span>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="project-tags">
                {project.tech.map((tech) => <span key={tech}>{tech}</span>)}
              </div>
              {project.link && (
                <a className="project-link" href={project.link.href} target="_blank" rel="noreferrer">
                  {project.link.label}<FiArrowUpRight aria-hidden="true" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="education-row">
        <strong>TED University · Software Engineering</strong>
        <span>Secondary field in Applied Data Analytics · Jan 2026</span>
      </div>
    </div>
  </section>
);
