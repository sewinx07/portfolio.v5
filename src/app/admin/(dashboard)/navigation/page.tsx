import type { Metadata } from "next";
import { db } from "@/lib/db";
import { NavEditor } from "@/components/admin/NavEditor";

export const metadata: Metadata = {
  title: "Navigation",
  robots: { index: false },
};

export default async function AdminNavPage() {
  const [nav, socials] = await Promise.all([
    db.navItem.findMany({ orderBy: { order: "asc" } }),
    db.socialLink.findMany({ orderBy: { order: "asc" } }),
  ]);
  return <NavEditor nav={nav} socials={socials} />;
}