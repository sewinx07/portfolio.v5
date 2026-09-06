import type { Metadata } from "next";
import { getContactPage, getSite, getSocials } from "@/lib/content";
import { PageReveal } from "@/components/public/PageReveal";
import { Reveal } from "@/components/public/Reveal";
import { TrackView } from "@/components/public/TrackView";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Let's build something worth experiencing.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [page, site, socials] = await Promise.all([getContactPage(), getSite(), getSocials()]);

  return (
    <PageReveal>
      <TrackView />
      <header className="page-head container">
        <span className="label">CONTACT</span>
        <span className="count-label label-light">LET'S WORK TOGETHER</span>
      </header>

      <section className="contact-hero container" aria-label="Contact">
        <Reveal>
          <h1 className="contact-title h1">{page.headline || "LET'S BUILD SOMETHING WORTH EXPERIENCING."}</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lead contact-sub">{page.sub || "Tell me about the project."}</p>
        </Reveal>
      </section>

      <section className="contact-grid container" aria-label="Contact details">
        <Reveal>
          <div className="contact-form-panel hairline-t">
            <span className="label">SEND A MESSAGE</span>
            <ContactForm />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <aside className="contact-side">
            {site?.contactEmail && (
              <div className="contact-block">
                <span className="label">EMAIL</span>
                <a className="contact-email" href={`mailto:${site.contactEmail}`}>
                  {site.contactEmail}
                </a>
              </div>
            )}
            <div className="contact-block">
              <span className="label">CHANNELS</span>
              <ul className="contact-socials">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a className="link" href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="contact-block">
              <span className="label">RESPONSE</span>
              <p className="contact-status">Usually within 48 hours.</p>
            </div>
          </aside>
        </Reveal>
      </section>
    </PageReveal>
  );
}