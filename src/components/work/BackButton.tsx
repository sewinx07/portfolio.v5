"use client";

import { useTransition } from "@/components/public/TransitionProvider";

export function BackButton() {
  const { navigate } = useTransition();
  return (
    <button className="back-button" onClick={() => navigate("/work")}>
      <span aria-hidden="true">←</span> ALL WORK
    </button>
  );
}