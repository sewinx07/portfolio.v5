"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const REDUCED = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function BootOverlay({ brand }: { brand: string }) {
  const [visible, setVisible] = useState(true);
  const [gone, setGone] = useState(false);
  const reduce = REDUCED();

  useEffect(() => {
    if (reduce || sessionStorage.getItem("tg_booted")) {
      setVisible(false);
      setGone(true);
      return;
    }
    sessionStorage.setItem("tg_booted", "1");
    const t1 = setTimeout(() => setVisible(false), 1100);
    const t2 = setTimeout(() => setGone(true), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduce]);

  useEffect(() => {
    document.documentElement.style.overflow = gone ? "" : "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [gone]);

  if (gone) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="boot"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <motion.div
            className="boot-name"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            transition={{ duration: reduce ? 0 : 0.8, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {brand || "TAHA GMIR"}
          </motion.div>
          <motion.div
            className="boot-role"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 0.4, duration: reduce ? 0 : 0.5 }}
          >
            CREATIVE DEVELOPER
          </motion.div>
          <motion.div
            className="boot-line"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: reduce ? 0 : 0.2, duration: reduce ? 0 : 0.9, ease: [0.83, 0, 0.17, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}