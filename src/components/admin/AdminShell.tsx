"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth-actions";
import { ToastHost } from "@/components/admin/toast";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", tag: "⌂" },
  { href: "/admin/projects", label: "Projects", tag: "▤" },
  { href: "/admin/media", label: "Media Library", tag: "▦" },
  { href: "/admin/pages", label: "Pages", tag: "¶" },
  { href: "/admin/navigation", label: "Navigation", tag: "≣" },
  { href: "/admin/technologies", label: "Technologies", tag: "+" },
  { href: "/admin/messages", label: "Messages", tag: "✉" },
  { href: "/admin/ai", label: "AI Guide", tag: "✦" },
  { href: "/admin/analytics", label: "Analytics", tag: "Σ" },
  { href: "/admin/settings", label: "Settings", tag: "⚙" },
];

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/projects": "Projects",
  "/admin/media": "Media Library",
  "/admin/pages": "Pages",
  "/admin/navigation": "Navigation & Socials",
  "/admin/technologies": "Technologies",
  "/admin/messages": "Messages",
  "/admin/ai": "AI Guide",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Site Settings",
};

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add("admin-body");
    return () => document.body.classList.remove("admin-body");
  }, []);

  const title = useMemo(() => {
    if (pathname.startsWith("/admin/projects") && pathname !== "/admin/projects") {
      return "Edit Project";
    }
    return TITLES[pathname] ?? "Admin";
  }, [pathname]);

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">
          <span className="admin-monogram">T</span>
          <span className="admin-brand-name">TAHA GMIR</span>
          <span className="admin-brand-sub">CONTROL ROOM</span>
        </div>
        <nav className="admin-nav">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn("admin-nav-link", active && "active")}
              >
                <span className="admin-nav-tag">{n.tag}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-side-foot">
          <Link className="admin-nav-link" href="/" target="_blank">
            <span className="admin-nav-tag">↗</span> View site
          </Link>
          <form action={logoutAction}>
            <button className="admin-nav-link admin-logout" type="submit">
              <span className="admin-nav-tag">⎋</span> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-top">
          <h1 className="admin-title">{title}</h1>
          <div className="admin-user">
            <span className="admin-role">{user.role}</span>
            <span className="admin-user-name">{user.name}</span>
            <span className="admin-user-email">{user.email}</span>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}