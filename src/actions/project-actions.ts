"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { slugify, errState, okState, type ActionState } from "@/lib/utils";
import { vString, vNumber } from "@/lib/validation";
import { SECTION_TYPES, PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@prisma/client";

export type ProjectPayload = {
  title?: string;
  slug?: string;
  tagline?: string;
  category?: string;
  year?: string;
  client?: string;
  role?: string;
  shortDescription?: string;
  description?: string;
  accent?: string;
  status?: string;
  featured?: boolean;
  liveUrl?: string;
  githubUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  thumbnailId?: string | null;
  heroMediaId?: string | null;
  technologyIds?: string[];
  galleryMediaIds?: string[];
  sections?: Array<{
    type: string;
    title?: string;
    content?: string;
    data?: string;
  }>;
};

function normalizePayload(raw: ProjectPayload) {
  return {
    title: vString(raw.title ?? "", 200, true),
    slug: slugify(raw.slug ?? raw.title ?? "") || "untitled",
    tagline: vString(raw.tagline ?? "", 300),
    category: vString(raw.category ?? "", 80) || "Web Experience",
    year: vString(raw.year ?? "", 20),
    client: vString(raw.client ?? "", 120),
    role: vString(raw.role ?? "", 200),
    shortDescription: vString(raw.shortDescription ?? "", 500),
    description: vString(raw.description ?? "", 5000),
    accent: /^#[0-9a-fA-F]{3,6}$/.test(raw.accent ?? "") ? raw.accent! : "#111111",
    status: PROJECT_STATUSES.includes(raw.status as never) ? (raw.status as ProjectStatus) : "DRAFT",
    featured: Boolean(raw.featured),
    liveUrl: vString(raw.liveUrl ?? "", 300),
    githubUrl: vString(raw.githubUrl ?? "", 300),
    metaTitle: vString(raw.metaTitle ?? "", 200),
    metaDescription: vString(raw.metaDescription ?? "", 300),
    thumbnailId: raw.thumbnailId || null,
    heroMediaId: raw.heroMediaId || null,
  };
}

export async function saveProjectAction(
  id: string | null,
  raw: ProjectPayload
): Promise<ActionState<{ id: string }>> {
  await requireAdmin();
  const data = normalizePayload(raw);

  try {
    // Slug uniqueness
    const existing = await db.project.findUnique({ where: { slug: data.slug } });
    if (existing && existing.id !== id) {
      return errState("Slug already in use. Choose another.", { slug: "Slug in use" }) as ActionState<{ id: string }>;
    }

    const sectionInputs = (raw.sections ?? []).map((s, i) => ({
      type: SECTION_TYPES.some((st) => st.id === s.type) ? s.type : "paragraph",
      title: vString(s.title ?? "", 200),
      content: vString(s.content ?? "", 30000),
      data: typeof s.data === "string" ? s.data : "{}",
      order: i,
    }));

    const techIds = (raw.technologyIds ?? []).filter(Boolean);
    const galleryIds = (raw.galleryMediaIds ?? []).filter(Boolean);

    let resultId = id;

    if (id) {
      // Remove old children and replace transactionally.
      await db.$transaction([
        db.projectTechnology.deleteMany({ where: { projectId: id } }),
        db.projectMedia.deleteMany({ where: { projectId: id } }),
        db.projectSection.deleteMany({ where: { projectId: id } }),
      ]);
      await db.project.update({
        where: { id },
        data: {
          ...data,
          technologies: { create: techIds.map((t, i) => ({ technologyId: t, order: i })) },
          gallery: { create: galleryIds.map((m, i) => ({ mediaItemId: m, order: i })) },
          sections: { create: sectionInputs },
        },
      });
    } else {
      const created = await db.project.create({
        data: {
          ...data,
          technologies: { create: techIds.map((t, i) => ({ technologyId: t, order: i })) },
          gallery: { create: galleryIds.map((m, i) => ({ mediaItemId: m, order: i })) },
          sections: { create: sectionInputs },
        },
      });
      resultId = created.id;
    }

    revalidatePath("/", "layout");
    return okState(id ? "Project saved." : "Project created.", { id: resultId! }) as ActionState<{ id: string }>;
  } catch (e) {
    console.error(e);
    return errState("Could not save project. Check required fields.") as ActionState<{ id: string }>;
  }
}

export async function setProjectStatusAction(id: string, status: string) {
  await requireAdmin();
  if (!PROJECT_STATUSES.includes(status as never)) return errState("Invalid status.");
  const publishedAt = status === "PUBLISHED" ? new Date() : undefined;
  await db.project.update({ where: { id }, data: { status: status as never, publishedAt } });
  revalidatePath("/", "layout");
  return okState(`Project ${status.toLowerCase()}.`);
}

export async function toggleFeaturedAction(id: string, featured: boolean) {
  await requireAdmin();
  await db.project.update({ where: { id }, data: { featured } });
  revalidatePath("/", "layout");
  return okState(featured ? "Featured." : "Removed from featured.");
}

export async function duplicateProjectAction(id: string) {
  await requireAdmin();
  const src = await db.project.findUnique({
    where: { id },
    include: { technologies: true, gallery: true, sections: true },
  });
  if (!src) return errState("Project not found.");
  const slugBase = slugify(src.title) || "copy";
  let slug = `${slugBase}-copy`;
  let n = 2;
  while (await db.project.findUnique({ where: { slug } })) {
    slug = `${slugBase}-copy-${n++}`;
  }
  try {
    const copy = await db.project.create({
      data: {
        title: `${src.title} (Copy)`,
        slug,
        tagline: src.tagline,
        category: src.category,
        year: src.year,
        client: src.client,
        role: src.role,
        shortDescription: src.shortDescription,
        description: src.description,
        accent: src.accent,
        status: "DRAFT",
        featured: false,
        order: src.order,
        liveUrl: src.liveUrl,
        githubUrl: src.githubUrl,
        metaTitle: src.metaTitle,
        metaDescription: src.metaDescription,
        thumbnailId: src.thumbnailId,
        heroMediaId: src.heroMediaId,
        technologies: {
          create: src.technologies.map((t) => ({ technologyId: t.technologyId, order: t.order })),
        },
        gallery: { create: src.gallery.map((g) => ({ mediaItemId: g.mediaItemId, order: g.order })) },
        sections: { create: src.sections.map((s) => ({ ...s, id: undefined })) },
      },
    });
    revalidatePath("/", "layout");
    return okState("Project duplicated.", { id: copy.id });
  } catch (e) {
    console.error(e);
    return errState("Duplication failed.");
  }
}

export async function deleteProjectAction(id: string) {
  await requireAdmin();
  await db.project.delete({ where: { id } }).catch((e) => {
    console.error(e);
    throw new Error("delete-failed");
  });
  revalidatePath("/", "layout");
  return okState("Project deleted.");
}

export async function reorderProjectsAction(orderedIds: string[]) {
  await requireAdmin();
  await db.$transaction(
    orderedIds.map((projectId, order) =>
      db.project.update({ where: { id: projectId }, data: { order } })
    )
  );
  revalidatePath("/", "layout");
  return okState("Order updated.");
}

// -------- revisions --------

export async function saveRevisionAction(projectId: string, note: string) {
  await requireAdmin();
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { technologies: true, gallery: true, sections: true },
  });
  if (!project) return errState("Project not found.");
  const max = await db.revision.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  const snapshot = JSON.stringify(project);
  const version = (max?.version ?? 0) + 1;
  await db.revision.create({ data: { projectId, version, note: note || `Version ${version}`, snapshot } });
  return okState(`Revision v${version} saved.`);
}

export async function restoreRevisionAction(projectId: string, revisionId: string) {
  await requireAdmin();
  const rev = await db.revision.findUnique({ where: { id: revisionId } });
  if (!rev || rev.projectId !== projectId) return errState("Revision not found.");
  try {
    const snap = JSON.parse(rev.snapshot);
    const payload: ProjectPayload = {
      title: snap.title,
      slug: snap.slug,
      tagline: snap.tagline,
      category: snap.category,
      year: snap.year,
      client: snap.client,
      role: snap.role,
      shortDescription: snap.shortDescription,
      description: snap.description,
      accent: snap.accent,
      status: "DRAFT",
      featured: snap.featured,
      liveUrl: snap.liveUrl,
      githubUrl: snap.githubUrl,
      metaTitle: snap.metaTitle,
      metaDescription: snap.metaDescription,
      thumbnailId: snap.thumbnailId ?? null,
      heroMediaId: snap.heroMediaId ?? null,
      technologyIds: (snap.technologies ?? []).map((t: { technologyId: string }) => t.technologyId),
      galleryMediaIds: (snap.gallery ?? []).map((g: { mediaItemId: string }) => g.mediaItemId),
      sections: (snap.sections ?? []).map((s: { type: string; title: string; content: string; data: string }) => ({
        type: s.type,
        title: s.title,
        content: s.content,
        data: s.data,
      })),
    };
    const res = await saveProjectAction(projectId, payload);
    return res;
  } catch (e) {
    console.error(e);
    return errState("Could not restore this revision.");
  }
}

// -------- technologies --------

export async function addTechnologyAction(name: string, category: string) {
  await requireAdmin();
  const clean = vString(name, 60, true);
  if (clean.length < 2) return errState("Technology name required.");
  const slug = slugify(clean);
  const existing = await db.technology.findUnique({ where: { slug } });
  if (existing) return okState("Already exists.");
  await db.technology.create({ data: { name: clean, slug, category: vString(category, 40) || "Tools" } });
  return okState("Technology added.");
}

export async function deleteTechnologyAction(id: string, force = false) {
  await requireAdmin();
  const usage = await db.projectTechnology.count({ where: { technologyId: id } });
  if (usage > 0 && !force) {
    return errState(`Technology is used by ${usage} project(s). Delete those links first, or force delete.`);
  }
  await db.technology.delete({ where: { id } }).catch(() => {});
  return okState("Technology deleted.");
}

export async function updateTechnologyCategoryAction(id: string, category: string) {
  await requireAdmin();
  await db.technology.update({ where: { id }, data: { category } });
  return okState("Updated.");
}