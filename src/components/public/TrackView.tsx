"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

let lastSent = "";

export function TrackView({ slug }: { slug?: string }) {
  const pathname = usePathname();
  const sent = useRef(false);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const key = `${pathname}|${slug ?? ""}`;
    if (lastSent === key) return;
    lastSent = key;

    const payload = slug
      ? { kind: "PROJECT_VIEW", path: pathname, slug }
      : { kind: "PAGE_VIEW", path: pathname, referrer: document.referrer };

    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, slug, reduce]);

  return null;
}