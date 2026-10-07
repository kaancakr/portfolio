import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { ExperienceSection } from "@/components/ExperiencesSection";
import { Footer } from "@/components/Footer";
import { Portfolio } from "@/components/Portfolio";
import { ProjectsSection } from "@/components/ProjectsSection";

export default function Home() {
  return (
    <Portfolio
      sections={{
        about: <AboutSection />,
        experience: <ExperienceSection />,
        projects: <ProjectsSection />,
        contact: (
          <>
            <ContactSection />
            <Footer />
          </>
        ),
      }}
    />
  );
}
