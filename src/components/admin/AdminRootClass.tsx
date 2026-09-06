"use client";

import { useEffect } from "react";

export function AdminRootClass() {
  useEffect(() => {
    document.body.classList.add("admin-body");
    return () => document.body.classList.remove("admin-body");
  }, []);
  return null;
}