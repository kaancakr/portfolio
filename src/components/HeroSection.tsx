import Link from "next/link";
import { FiArrowDown, FiArrowUpRight, FiGithub } from "react-icons/fi";

const HeroSection = () => (
  <section id="home" className="hero">
    <div className="page-shell hero-grid">
      <div>
        <div className="eyebrow">Software Engineer · Ankara, Türkiye</div>
        <h1 className="hero-title">Hi, I&apos;m <span>Kaan.</span></h1>
        <p className="hero-copy">
          I build secure API platforms and real-time products, turning complex systems into clear, reliable experiences.
        </p>
        <div className="hero-actions">
          <Link href="#projects" className="button-primary">Explore my work <FiArrowDown /></Link>
          <a href="/Eren_Kaan_Cakir_Resume.pdf" download className="button-secondary">Download my CV <FiArrowUpRight /></a>
        </div>
        <div className="hero-socials">
          <a href="https://github.com/kaancakr" target="_blank" rel="noreferrer"><FiGithub /> GitHub</a>
          <a href="mailto:erenkaancakr@gmail.com">erenkaancakr@gmail.com</a>
        </div>
      </div>
      <div className="profile-card" aria-label="Kaan Çakır profile card">
        <div className="profile-orbit"><span className="profile-initials">K<span style={{ color: "#f2f3ed" }}>Ç</span></span></div>
        <div className="profile-status"><span className="status-dot" /> API security & product engineering</div>
      </div>
    </div>
  </section>
);

export default HeroSection;
