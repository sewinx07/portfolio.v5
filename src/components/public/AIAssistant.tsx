"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTransition } from "@/components/public/TransitionProvider";

type Msg = { role: "user" | "assistant"; content: string; projectSlug?: string; projectTitle?: string };

export function AIAssistant({
  enabled,
  name,
  welcome,
  suggestions,
}: {
  enabled: boolean;
  name: string;
  welcome: string;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { navigate } = useTransition();

  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (open && !booted) {
      setBooted(true);
      setMsgs([{ role: "assistant", content: welcome }]);
    }
  }, [open, booted, welcome]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy, open]);

  if (!enabled) return null;

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...msgs, { role: "user", content: q }].map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error("ai-error");
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: data.reply, projectSlug: data.projectSlug ?? undefined },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: "I couldn't reach my knowledge base. Try asking again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function openProject(slug: string) {
    navigate(`/work/${slug}`);
    setOpen(false);
  }

  return (
    <>
      <motion.button
        className="ai-launcher"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close portfolio guide" : "Open portfolio guide"}
        aria-expanded={open}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <span className="ai-launcher-mark">{name.replace(/[^A-Z]/g, "").slice(0, 3) || "AI"}</span>
        <span className="ai-launcher-label">{open ? "CLOSE" : "GUIDE"}</span>
        <span className="ai-pulse" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="ai-panel"
            role="dialog"
            aria-label="Portfolio guide"
            initial={{ opacity: 0, y: reduce ? 0 : 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 24 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="ai-head">
              <div>
                <div className="ai-head-name">{name}</div>
                <div className="ai-head-sub">PORTFOLIO GUIDE</div>
              </div>
              <button className="ai-close" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="ai-body" ref={scrollRef}>
              {msgs.map((m, i) => (
                <div key={i} className={`ai-msg ${m.role === "user" ? "ai-msg-user" : "ai-msg-assist"}`}>
                  <div className="ai-msg-text">{m.content}</div>
                  {m.projectSlug && (
                    <button className="ai-project-cta" onClick={() => openProject(m.projectSlug!)}>
                      VIEW PROJECT →
                    </button>
                  )}
                </div>
              ))}
              {busy && (
                <div className="ai-msg ai-msg-assist">
                  <span className="ai-typing">
                    <i /><i /><i />
                  </span>
                </div>
              )}
            </div>

            {msgs.length <= 1 && (
              <div className="ai-chips">
                {suggestions.slice(0, 3).map((s) => (
                  <button key={s} className="ai-chip" onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              className="ai-inputrow"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <input
                className="ai-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the work…"
                aria-label="Ask the portfolio guide"
              />
              <button className="ai-send" type="submit" disabled={busy || !input.trim()} aria-label="Send">
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}