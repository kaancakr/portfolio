import { FiArrowUpRight } from "react-icons/fi";

export const ContactSection = () => (
  <section id="contact" className="section">
    <div className="page-shell">
      <div className="contact-box">
        <div>
          <div className="eyebrow">04 / Contact</div>
          <h2>Let&apos;s build something meaningful.</h2>
          <p>Get in touch about new projects and engineering opportunities.</p>
        </div>
        <a href="mailto:erenkaancakr@gmail.com" className="button-primary">Send me an email <FiArrowUpRight /></a>
      </div>
    </div>
  </section>
);
