"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type PickMedia = {
  id: string;
  url: string;
  kind: string;
  width: number | null;
  height: number | null;
  alt: string;
  filename: string;
};

export function MediaPicker({
  media,
  open,
  mode = "single",
  onClose,
  onPick,
}: {
  media: PickMedia[];
  open: boolean;
  mode?: "single" | "multi";
  onClose: () => void;
  onPick: (items: PickMedia[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("ALL");
  const [selected, setSelected] = useState<PickMedia[]>([]);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = media.filter((m) => {
    if (kind !== "ALL" && m.kind !== kind) return false;
    if (query && !`${m.filename} ${m.alt}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const kinds = ["ALL", "IMAGE", "VIDEO", "SVG"];

  function toggle(m: PickMedia) {
    if (mode === "single") {
      setSelected([m]);
      return;
    }
    setSelected((s) =>
      s.some((x) => x.id === m.id) ? s.filter((x) => x.id !== m.id) : [...s, m]
    );
  }

  function confirm() {
    onPick(selected);
    onClose();
  }

  return (
    <div className="picker-backdrop" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="picker-head">
          <div className="picker-title">
            {mode === "multi" ? "SELECT MEDIA" : "CHOOSE MEDIA"}
            {selected.length > 0 && <span className="card-count">{selected.length}</span>}
          </div>
          <div className="picker-tools">
            {kinds.map((k) => (
              <button
                key={k}
                className={cn("pk", kind === k && "active")}
                onClick={() => setKind(k)}
              >
                {k}
              </button>
            ))}
            <input
              className="input pk-search"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              ✕
            </button>
          </div>
        </header>
        <div className="picker-grid">
          {filtered.map((m) => {
            const isSel = selected.some((x) => x.id === m.id);
            return (
              <button
                key={m.id}
                className={cn("pk-cell", isSel && "selected")}
                onClick={() => toggle(m)}
              >
                {m.kind === "VIDEO" ? (
                  <video src={m.url} muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt} />
                )}
                {m.kind === "SVG" && <span className="pk-badge">SVG</span>}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty picker-empty">
              <span className="empty-title">No files match</span>
            </div>
          )}
        </div>
        <footer className="picker-foot">
          {mode === "multi" && (
            <span className="picker-count">
              {selected.length} selected · press ✓ to confirm
            </span>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            CANCEL
          </button>
          <button className="btn btn-primary" onClick={confirm} disabled={selected.length === 0}>
            ✓ APPLY
          </button>
        </footer>
      </div>
    </div>
  );
}