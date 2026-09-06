"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

const LABELS: Record<string, string> = {
  "/": "ENTER",
  "/work": "WORK",
  "/about": "ABOUT",
  "/contact": "CONTACT",
};

type TransitionContextValue = {
  navigate: (path: string) => void;
  transitioning: boolean;
};

const TransitionContext = createContext<TransitionContextValue>({
  navigate: () => {},
  transitioning: false,
});

export const useTransition = () => useContext(TransitionContext);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const [label, setLabel] = useState("ENTER");
  const targetRef = useRef<string | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const navigate = useCallback(
    (path: string) => {
      if (path === pathname || targetRef.current === path) return;
      targetRef.current = path;
      const key = `/${path.split("/").filter(Boolean)[0] ?? ""}`;
      const base = path.replace(/\/+$/, "") || "/";
      setLabel((LABELS[base] ?? "") || (LABELS[key] ?? base.toUpperCase()));
      setPhase("cover");
    },
    [pathname]
  );

  // When the route actually changes, reveal the page.
  useEffect(() => {
    if (!targetRef.current) return;
    if (targetRef.current !== pathname) return;
    if (phase === "cover") {
      if (reduceMotion) {
        setPhase("idle");
      } else {
        setPhase("reveal");
        idleTimer.current = setTimeout(() => setPhase("idle"), 750);
      }
      targetRef.current = null;
    }
  }, [pathname, phase, reduceMotion]);

  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // Drive the actual push once the cover is up.
  useEffect(() => {
    if (phase === "cover") {
      document.documentElement.style.overflow = "hidden";
      const t = setTimeout(() => {
        if (targetRef.current) router.push(targetRef.current);
      }, reduceMotion ? 0 : 360);
      return () => clearTimeout(t);
    }
    document.documentElement.style.overflow = "";
  }, [phase, router, reduceMotion]);

  return (
    <TransitionContext.Provider value={{ navigate, transitioning: phase !== "idle" }}>
      {children}
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            className="route-overlay"
            aria-hidden="true"
            initial={false}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.83, 0, 0.17, 1] }}
            style={{ y: phase === "cover" ? "-100%" : 0 }}
          >
            <RoutePanel label={label} leaving={phase === "cover"} />
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  );
}

function RoutePanel({ label, leaving }: { label: string; leaving: boolean }) {
  return (
    <div className="route-panel">
      <motion.div
        className="route-label"
        initial={false}
        animate={leaving ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {label}
      </motion.div>
    </div>
  );
}