"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function Hero({
  kicker,
  label,
  roles,
  statement,
  cta,
}: {
  kicker: string;
  label: string;
  roles: string[];
  statement: string;
  cta: string;
}) {
  const [role, setRole] = useState(0);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const explore = () => document.getElementById("work")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });

  useEffect(() => {
    if (reduce || roles.length < 2) return;
    const t = setInterval(() => setRole((r) => (r + 1) % roles.length), 2200);
    return () => clearInterval(t);
  }, [roles.length, reduce]);

  return (
    <section className="hero" aria-label="Introduction">
      <div className="container hero-grid">
        <motion.div
          className="hero-meta"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.4, duration: 0.8 }}
        >
          <span className="label">{label}</span>
          <span className="hero-loc">WEB · MOTION · FILM</span>
        </motion.div>

        <div className="hero-main">
          <motion.h1
            className="h1 hero-name"
            initial={reduce ? false : { opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.15, duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {kicker}
          </motion.h1>

          <div className="hero-roles" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.span
                key={role}
                className="hero-role"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -14 }}
                transition={{ duration: reduce ? 0 : 0.4 }}
              >
                {roles[role] ?? ""}
              </motion.span>
            </AnimatePresence>
            <span className="hero-caret">_</span>
          </div>

          <motion.div
            className="hero-statement"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 0.5, duration: 0.9 }}
          >
            {statement.split(".").filter(Boolean).map((word, i, arr) => (
              <span key={word} className={`statement-line ${i === arr.length - 1 ? "statement-accent" : ""}`}>
                {word.trim()}.
              </span>
            ))}
          </motion.div>

          <motion.div
            className="hero-cta"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.7, duration: 0.7 }}
          >
            <button className="btn btn-solid" onClick={explore}>
              {cta}
              <span aria-hidden="true">↓</span>
            </button>
            <span className="hero-hint label-light">SCROLL TO MOVE THROUGH THE WORK</span>
          </motion.div>
        </div>
      </div>

      <div className="hero-frame" aria-hidden="true">
        <span className="hero-frame-tl" />
        <span className="hero-frame-br" />
      </div>
      <div className="hero-index" aria-hidden="true">
        <span className="label">INDEX</span>
        <span className="hero-index-num">01 / 05</span>
      </div>
    </section>
  );
}