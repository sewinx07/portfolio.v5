import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const metadata: Metadata = {
  title: "Media Library",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const media = await db.mediaItem.findMany({ orderBy: { uploadedAt: "desc" } });
  return <MediaLibrary initial={media} />;
}