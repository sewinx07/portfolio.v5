"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTransition } from "@/components/public/TransitionProvider";
import { MediaAsset } from "@/components/public/MediaAsset";
import type { HeroCard } from "@/lib/project-helpers";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const MOBILE_QUERY = "(max-width: 860px)";

const DESKTOP = {
  spacingX: 340,
  depth: 300,
  scaleDrop: 0.14,
  rotY: 14,
  opacityDrop: 0.16,
  yCurve: 10,
};

const MOBILE = {
  spacingX: 108,
  depth: 160,
  scaleDrop: 0.16,
  rotY: 11,
  opacityDrop: 0.28,
  yCurve: 6,
};

type Item = HeroCard;

function wrapIndex(i: number, n: number) {
  return ((i % n) + n) % n;
}

function centeredRel(idx: number, active: number, total: number) {
  let rel = idx - active;
  const half = Math.floor(total / 2);
  if (rel > half) rel -= total;
  if (rel < -half) rel += total;
  return rel;
}

function useGalleryDevice() {
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const rq = window.matchMedia(REDUCED_QUERY);
    const update = () => {
      setMobile(mq.matches);
      setReduced(rq.matches);
    };
    update();
    mq.addEventListener("change", update);
    rq.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      rq.removeEventListener("change", update);
    };
  }, []);
  return { mobile, reduced };
}

export function ArcGallery({
  projects,
  standalone = false,
}: {
  projects: Item[];
  standalone?: boolean;
}) {
  const { navigate } = useTransition();
  const { mobile, reduced } = useGalleryDevice();
  const [active, setActive] = useState(0);
  const [expanding, setExpanding] = useState<Item | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, dx: 0 });
  const draggingRef = useRef(false);
  const suppressClick = useRef(false);

  const total = projects.length;
  const activeItem = projects[active] as Item | undefined;

  useEffect(() => {
    if (!projects.length) return;
    const raw = sessionStorage.getItem("taha_arc_index");
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n < projects.length) setActive(n);
  }, [projects.length]);

  useEffect(() => {
    if (projects.length) sessionStorage.setItem("taha_arc_index", String(active));
  }, [active, projects.length]);

  const prev = useCallback(() => setActive((a) => wrapIndex(a - 1, projects.length)), [projects.length]);
  const next = useCallback(() => setActive((a) => wrapIndex(a + 1, projects.length)), [projects.length]);

  const openProject = useCallback(
    (p: Item) => {
      if (reduced) {
        navigate(`/work/${p.slug}`);
        return;
      }
      setExpanding(p);
      window.setTimeout(() => {
        navigate(`/work/${p.slug}`);
        window.setTimeout(() => setExpanding(null), 900);
      }, 460);
    },
    [navigate, reduced]
  );

  const handleItemClick = useCallback(
    (i: number) => {
      if (suppressClick.current) return;
      if (i === active) {
        if (activeItem) openProject(activeItem);
      } else {
        setActive(i);
      }
    },
    [active, activeItem, openProject]
  );

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  // Wheel (desktop only)
  useEffect(() => {
    if (reduced || mobile || standalone === false) return;
    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - wheelLock.current < 320) return;
      wheelLock.current = now;
      if (e.deltaY > 0) next();
      else if (e.deltaY < 0) prev();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [prev, next, reduced, mobile, standalone]);

  // Touch swipe (mobile)
  useEffect(() => {
    if (!mobile) return;
    const el = stageRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = touchStart.current;
      touchStart.current = null;
      if (!t) return;
      const dx = e.changedTouches[0].clientX - t.x;
      const dy = e.changedTouches[0].clientY - t.y;
      if (Math.abs(dx) < 48 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) next();
      else prev();
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [mobile, next, prev]);

  // Mouse parallax (desktop, non-reduced)
  useEffect(() => {
    if (reduced || mobile) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        setParallax({ x: nx * 12, y: ny * 8 });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced, mobile]);

  // Desktop drag navigation (pointer)
  useEffect(() => {
    if (reduced || mobile) return;
    const el = stageRef.current;
    if (!el) return;
    const clamp = (v: number) => Math.max(-150, Math.min(150, v));
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, dx: 0 };
    };
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(e.clientY - d.startY)) {
        if (!draggingRef.current) {
          draggingRef.current = true;
          setDragging(true);
          suppressClick.current = true;
          el.style.cursor = "grabbing";
        }
        d.dx = dx;
        setDragX(clamp(dx));
      }
    };
    const onUp = () => {
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      if (draggingRef.current) {
        if (d.dx <= -60) next();
        else if (d.dx >= 60) prev();
        draggingRef.current = false;
        setDragging(false);
        setDragX(0);
        el.style.cursor = "";
        setTimeout(() => {
          suppressClick.current = false;
        }, 150);
      }
    };
    const onDragStart = (e: Event) => e.preventDefault();
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, [reduced, mobile, next, prev]);

  const cfg = mobile ? MOBILE : DESKTOP;
  const items = useMemo(
    () =>
      projects.map((p, i) => {
        const rel = centeredRel(i, active, total);
        const abs = Math.abs(rel);
        return {
          p,
          rel,
          abs,
          z: abs * cfg.depth,
          x: rel * cfg.spacingX + dragX + parallax.x * (0.15 + abs * 0.02),
          y: abs * abs * cfg.yCurve + parallax.y * (0.12 + abs * 0.02),
          scale: Math.max(0.35, 1 - abs * cfg.scaleDrop),
          rotateY: rel * cfg.rotY,
          opacity: Math.max(0.08, 1 - abs * cfg.opacityDrop),
          zIndex: 100 - abs,
          isActive: rel === 0,
        };
      }),
    [projects, active, total, cfg, parallax, dragX]
  );

  if (total === 0) return null;

  // Reduced motion / tiny lists: simple flat rows
  if (reduced || total < 2) {
    return (
      <section className={`arc ${standalone ? "arc-standalone" : ""}`} id="work" aria-label="Selected projects">
        {standalone && (
          <header className="arc-head container">
            <div className="arc-intro">
              <span className="label">WORK — SELECTED PROJECTS</span>
              <h1 className="arc-intro-title h2">A FEW THINGS I'VE BUILT.</h1>
            </div>
            <span className="count-label label-light">
              {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </header>
        )}
        <div className="container arc-flat">
          {projects.map((p, i) => (
            <button
              key={p.id}
              className="flat-card"
              onClick={() => openProject(p)}
              data-cursor="VIEW"
              aria-label={`Open project: ${p.title}`}
            >
              <span className="flat-index label">{String(i + 1).padStart(2, "0")}</span>
              <div className="flat-media media-frame">
                <MediaAsset media={p.thumbnail} fill sizes="100vw" />
              </div>
              <div className="flat-info">
                <span className="flat-title h3">{p.title}</span>
                <span className="flat-meta label-light">
                  {p.category} · {p.year || "—"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  const progress = ((active + 1) / total) * 100;

  return (
    <section
      className={`arc ${standalone ? "arc-standalone" : ""}`}
      id="work"
      aria-label="Selected projects"
    >
      <header className="arc-head container">
        <div className="arc-intro">
          <span className="label">{standalone ? "WORK — SELECTED PROJECTS" : "SELECTED WORK — MMXXVI"}</span>
          {standalone && <h1 className="arc-intro-title h2">A FEW THINGS I'VE BUILT.</h1>}
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={active}
            className="arc-counter label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {String(active + 1).padStart(2, "0")} <em>/</em> {String(total).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </header>

      <div
        className="arc-stage"
        ref={stageRef}
        style={{ perspective: mobile ? 900 : 1400 }}
        aria-label="Project gallery"
      >
        {items.map(({ p, x, y, z, scale, rotateY, opacity, zIndex, isActive, abs }) => {
          return (
            <motion.button
              key={p.id}
              className={`arc-item ${isActive ? "arc-item-active" : ""}`}
              style={{ zIndex, "--proj-accent": p.accent } as CSSProperties}
              initial={false}
              animate={{ x, y, z, scale, rotateY, opacity }}
              transition={{ duration: dragging ? 0.12 : 0.75, ease: [0.22, 0.61, 0.36, 1] }}
              onClick={() => handleItemClick(projects.indexOf(p))}
              data-cursor={isActive ? "ENTER" : "VIEW"}
              aria-label={isActive ? `Open project: ${p.title}` : `Show project: ${p.title}`}
              aria-current={isActive ? "true" : undefined}
              tabIndex={isActive || abs <= 1 ? 0 : -1}
            >
              <span className="arc-item-inner">
                <span className="arc-frame">
                  <MediaAsset
                    media={p.thumbnail}
                    fill
                    sizes="(max-width: 860px) 74vw, 42vw"
                  />
                </span>
                <span className="arc-meta">
                  <span className="arc-index label">
                    {String(projects.indexOf(p) + 1).padStart(2, "0")}
                  </span>
                  <span className="arc-title">{p.title}</span>
                  <span className="arc-sub label-light">
                    {p.category} · {p.year || "—"}
                  </span>
                </span>
              </span>
            </motion.button>
          );
        })}

        {/* Active detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="arc-detail"
            initial={{ opacity: 0, y: mobile ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: mobile ? 0 : -10 }}
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            aria-live="polite"
          >
            <motion.button
              className="arc-detail-title"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
              onClick={() => activeItem && openProject(activeItem)}
              data-cursor="ENTER"
              tabIndex={mobile ? 0 : -1}
            >
              <h2 className="h2">{activeItem?.title}</h2>
            </motion.button>
            <p className="arc-detail-desc">{activeItem?.shortDescription}</p>
            <div className="arc-tech label-light">
              {activeItem?.category}
              {activeItem?.year ? ` — ${activeItem.year}` : ""}
            </div>
            <button
              className="btn btn-sm btn-solid arc-open"
              onClick={() => activeItem && openProject(activeItem)}
              style={{ visibility: mobile ? "hidden" : "visible" }}
            >
              VIEW PROJECT →
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="arc-progress container" aria-hidden="true">
        <span className="arc-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <AnimatePresence>
        {expanding && (
          <motion.div
            className="arc-expand"
            initial={{ opacity: 0, scale: 0.16, borderRadius: 24 }}
            animate={{ opacity: 1, scale: 1, borderRadius: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.46, ease: [0.83, 0, 0.17, 1] }}
            aria-hidden="true"
          >
            <MediaAsset media={expanding.thumbnail} className="arc-expand-img" fill />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}