import type { Metadata } from "next";
import { getAbout } from "@/lib/content";
import { Reveal } from "@/components/public/Reveal";
import { PageReveal } from "@/components/public/PageReveal";
import { TrackView } from "@/components/public/TrackView";

export const metadata: Metadata = {
  title: "About",
  description: "Creative developer and designer working across web, interface and motion.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const about = await getAbout();

  return (
    <PageReveal>
      <TrackView />
      <header className="page-head container about-head">
        <span className="label">{about.introLabel.toUpperCase()}</span>
        <span className="count-label label-light">BIOGRAPHICAL INDEX</span>
      </header>

      <section className="about-hero container" aria-label="Identity">
        <Reveal>
          <h1 className="about-name h1">{about.name}</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="about-role lead">{about.role}</p>
        </Reveal>
      </section>

      <section className="about-bio-grid container" aria-label="Intro">
        <Reveal>
          <blockquote className="about-quote h2">{about.pullQuote}</blockquote>
          <div className="hairline" />
          <span className="label">{about.bioTitle}</span>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="about-bio-text">
            {about.bio.split("\n\n").map((p, i) => (
              <p key={i} className="lead">{p}</p>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="about-info container" aria-label="Info">
        <Reveal>
          <div className="hairline" />
          <span className="label">{about.infoTitle}</span>
          <dl className="about-info-list">
            <div><dt className="label-light">LOCATION</dt><dd>{about.location}</dd></div>
            <div><dt className="label-light">STATUS</dt><dd>{about.available}</dd></div>
            <div><dt className="label-light">LANGUAGES</dt><dd>{about.languages}</dd></div>
          </dl>
        </Reveal>
      </section>

      <section className="about-timelines container" aria-label="Experience and education">
        <div>
          <Reveal>
            <span className="label">{about.experienceTitle}</span>
            {(about.experience ?? []).map((e, i) => (
              <div key={i} className="timeline-row hairline-t">
                <span className="timeline-period label-light">{e.period}</span>
                <div className="timeline-main">
                  <h3 className="timeline-role">{e.role}</h3>
                  <span className="timeline-org label-light">{e.org}</span>
                  {e.text && <p className="timeline-text">{e.text}</p>}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
        <div>
          <Reveal delay={0.08}>
            <span className="label">{about.educationTitle}</span>
            {(about.education ?? []).map((e, i) => (
              <div key={i} className="timeline-row hairline-t">
                <span className="timeline-period label-light">{e.period}</span>
                <div className="timeline-main">
                  <h3 className="timeline-role">{e.degree}</h3>
                  <span className="timeline-org label-light">{e.org}</span>
                  {e.text && <p className="timeline-text">{e.text}</p>}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="about-services container" aria-label="Services">
        <Reveal>
          <div className="hairline" />
          <span className="label">{about.servicesTitle}</span>
        </Reveal>
        <div className="services-grid">
          {(about.services ?? []).map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <div className="service-card hairline-t">
                <span className="label">0{i + 1}</span>
                <h3 className="service-title">{s.title}</h3>
                <p className="service-text">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </PageReveal>
  );
}