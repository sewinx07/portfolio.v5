"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import { usePathname } from "next/navigation";
import { useTransition } from "@/components/public/TransitionProvider";

type NavItem = { id: string; label: string; href: string };

function useScrollProgress() {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 120, damping: 30, mass: 0.4 });
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      mv.set(total > 0 ? window.scrollY / total : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mv]);
  return spring;
}

export function SiteHeader({ brand, nav }: { brand: string; nav: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { navigate } = useTransition();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container header-row">
          <button
            className="header-brand"
            onClick={() => navigate("/")}
            aria-label="Back to start"
          >
            <span className="header-monogram">TG</span>
            <span className="header-word">{brand}</span>
          </button>

          <nav className="header-nav" aria-label="Primary">
            {nav.map((n) => (
              <button
                key={n.id}
                className={`header-link ${pathname.startsWith(n.href) ? "is-active" : ""}`}
                onClick={() => navigate(n.href)}
              >
                <span>{n.label}</span>
              </button>
            ))}
          </nav>

          <div className="header-right">
            <span className="header-status">
              <i className="status-dot" />
              OPEN FOR WORK
            </span>
            <button
              className="header-burger"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span /><span />
            </button>
          </div>
        </div>

        <div className="header-progress" aria-hidden="true">
          <motion.div className="header-progress-bar" style={{ scaleX: useScrollProgress() }} />
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="menu-overlay"
            initial={{ y: reduce ? 0 : "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : "-100%" }}
            transition={{ duration: reduce ? 0 : 0.5, ease: [0.83, 0, 0.17, 1] }}
            role="dialog"
            aria-label="Menu"
          >
            <nav className="menu-links" aria-label="Mobile">
              {nav.map((n, i) => (
                <motion.button
                  key={n.id}
                  className="menu-link"
                  onClick={() => navigate(n.href)}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : 0.15 + i * 0.07 }}
                >
                  <span className="menu-index">0{i + 1}</span>
                  {n.label}
                </motion.button>
              ))}
            </nav>
            <div className="menu-foot">
              <span className="label-light">PORTFOLIO — MMXXVI</span>
            </div>
          </motion.div>
        )}
</AnimatePresence>
  </>
  );
}