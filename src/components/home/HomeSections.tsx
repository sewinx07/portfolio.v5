"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useTransition } from "@/components/public/TransitionProvider";

function Reveal({ children, delay = 0, y = 32 }: { children: ReactNode; delay?: number; y?: number }) {
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.8, delay: reduce ? 0 : delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StorySection(props: {
  title: string;
  paragraph: string;
  points: Array<{ label: string; text: string }>;
}) {
  return (
    <section className="story" aria-label="Process">
      <div className="container">
        <div className="story-head">
          <Reveal>
            <span className="kicker">02 — THE OVERLAP</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="story-title h2">{props.title}</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="lead story-lead">{props.paragraph}</p>
          </Reveal>
        </div>
        <div className="story-points">
          {props.points.map((p, i) => (
            <Reveal key={p.label} delay={i * 0.08}>
              <div className="story-point">
                <span className="label">{p.label}</span>
                <p className="story-point-text">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutPreviewSection(props: {
  title: string;
  text: string;
}) {
  const { navigate } = useTransition();
  return (
    <section className="about-preview" aria-label="About">
      <div className="container">
        <Reveal>
          <div className="hairline" />
        </Reveal>
        <div className="about-preview-grid">
          <Reveal delay={0.05}>
            <span className="kicker">03 — {props.title}</span>
          </Reveal>
          <Reveal delay={0.12}>
            <h2 className="about-preview-text h2">
              {props.text}
            </h2>
          </Reveal>
          <Reveal delay={0.22}>
            <button className="btn about-preview-cta" onClick={() => navigate("/about")}>
              MORE ABOUT ME →
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function SkillsSection(props: {
  title: string;
  skills: Array<{ group: string; items: string[] }>;
}) {
  return (
    <section className="skills" aria-label="Capabilities">
      <div className="container">
        <Reveal>
          <div className="hairline" />
          <h2 className="skills-title h2">{props.title}</h2>
        </Reveal>
        <div className="skills-grid">
          {props.skills.map((g, gi) => (
            <Reveal key={g.group} delay={gi * 0.07}>
              <div className="skill-group">
                <span className="label">{g.group}</span>
                <ul className="skill-list">
                  {g.items.map((item) => (
                    <li key={item} className="skill-item">
                      <span className="skill-bullet" aria-hidden="true">/</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactCta(props: { headline: string; sub: string }) {
  const { navigate } = useTransition();
  return (
    <section className="contact-cta container" aria-label="Contact">
      <Reveal>
        <span className="kicker">05 — CONTACT</span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="contact-cta-title h1">{props.headline}</h2>
      </Reveal>
      <Reveal delay={0.2}>
        <p className="lead">{props.sub}</p>
      </Reveal>
      <Reveal delay={0.3}>
        <button className="btn btn-solid contact-cta-btn" onClick={() => navigate("/contact")}>
          START A CONVERSATION →
        </button>
      </Reveal>
    </section>
  );
}

export function FinalSection(props: { headline: string; kicker: string; accent: string }) {
  return (
    <section className="final" aria-label="End of exhibition">
      <div className="final-grain" aria-hidden="true" />
      <Reveal>
        <div className="final-inner container">
          <span className="final-kicker label">{props.kicker}</span>
          <h2 className="final-headline h1">{props.headline}</h2>
          <div className="final-credits">
            <span className="final-accent">{props.accent}</span>
            <span className="final-tag label">DESIGN. CODE. EXPERIENCE.</span>
            <span className="final-mark">TG</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}