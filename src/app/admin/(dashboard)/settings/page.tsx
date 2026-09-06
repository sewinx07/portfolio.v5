import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default async function AdminSettingsPage() {
  const settings = await db.siteSettings.findUnique({ where: { id: "site" } });
  const user = await db.user.findFirst();
  return <SettingsForm settings={settings ?? null} user={user ?? null} />;
}