"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { errState, okState } from "@/lib/utils";
import { deleteUploadFile } from "@/lib/upload";

export async function updateMediaAction(
  id: string,
  data: { alt?: string; caption?: string; filename?: string }
) {
  await requireAdmin();
  await db.mediaItem.update({
    where: { id },
    data: {
      alt: data.alt ?? undefined,
      caption: data.caption ?? undefined,
      filename: data.filename ?? undefined,
    },
  });
  return okState("Media updated.");
}

export async function deleteMediaAction(id: string) {
  await requireAdmin();
  const media = await db.mediaItem.findUnique({ where: { id } });
  if (!media) return errState("Media not found.");

  const uses = await countMediaUsage(id);
  if (uses > 0) {
    return errState(`This file is used in ${uses} place(s). Remove it from projects first.`);
  }
  await db.mediaItem.delete({ where: { id } });
  await deleteUploadFile(media.url);
  revalidatePath("/", "layout");
  return okState("Media deleted.");
}

export async function countMediaUsage(id: string): Promise<number> {
  const [gallery, thumbs, heroes, pages, settings, sections] = await Promise.all([
    db.projectMedia.count({ where: { mediaItemId: id } }),
    db.project.count({ where: { thumbnailId: id } }),
    db.project.count({ where: { heroMediaId: id } }),
    db.pageContent.findMany({ select: { content: true, logoId: true, socialImageId: true } }),
    db.siteSettings.findUnique({ where: { id: "site" } }),
    db.projectSection.findMany({ select: { data: true } }),
  ]);

  let pageUses = 0;
  for (const p of pages) {
    if (p.logoId === id || p.socialImageId === id) pageUses++;
    if (p.content.includes(id)) pageUses++;
  }
  let settingsUses = 0;
  if (settings && [settings.faviconId, settings.logoId, settings.socialImageId].includes(id)) {
    settingsUses++;
  }
  let sectionUses = 0;
  for (const s of sections) {
    if (s.data.includes(id)) sectionUses++;
  }

  return gallery + thumbs + heroes + pageUses + settingsUses + sectionUses;
}