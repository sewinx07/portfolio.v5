import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectEditor } from "@/components/admin/ProjectEditor";
import type { PickMedia } from "@/components/admin/MediaPicker";
import type { ProjectPayload } from "@/actions/project-actions";

export const metadata: Metadata = {
  title: "Edit Project",
  robots: { index: false },
};

export default async function AdminProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  const [project, media, technologies, revisions] = await Promise.all([
    isNew
      ? null
      : db.project.findUnique({
          where: { id },
          include: {
            thumbnail: true,
            heroMedia: true,
            technologies: { include: { technology: true }, orderBy: { order: "asc" } },
            gallery: { include: { mediaItem: true }, orderBy: { order: "asc" } },
            sections: { orderBy: { order: "asc" } },
            revisions: { orderBy: { version: "desc" } },
          },
        }),
    db.mediaItem.findMany({ orderBy: { uploadedAt: "desc" } }),
    db.technology.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    isNew
      ? []
      : db.revision.findMany({ where: { projectId: id }, orderBy: { version: "desc" } }),
  ]);

  if (!isNew && !project) notFound();

  const mediaList: PickMedia[] = media.map((m) => ({
    id: m.id,
    url: m.url,
    kind: m.kind,
    width: m.width,
    height: m.height,
    alt: m.alt,
    filename: m.filename,
  }));

  const initial: ProjectPayload = isNew
    ? {
        title: "",
        status: "DRAFT",
        featured: false,
      }
    : {
        title: project!.title,
        tagline: project!.tagline,
        category: project!.category,
        year: project!.year,
        client: project!.client,
        role: project!.role,
        shortDescription: project!.shortDescription,
        description: project!.description,
        accent: project!.accent,
        status: project!.status,
        featured: project!.featured,
        liveUrl: project!.liveUrl,
        githubUrl: project!.githubUrl,
        metaTitle: project!.metaTitle,
        metaDescription: project!.metaDescription,
        thumbnailId: project!.thumbnailId ?? null,
        heroMediaId: project!.heroMediaId ?? null,
        technologyIds: project!.technologies.map((t) => t.technologyId),
        galleryMediaIds: project!.gallery.map((g) => g.mediaItemId),
        sections: project!.sections.map((s) => ({
          type: s.type,
          title: s.title,
          content: s.content,
          data: s.data,
        })),
      };

  return (
    <ProjectEditor
      id={isNew ? null : project!.id}
      slug={project?.slug ?? ""}
      isNew={isNew}
      published={project?.status === "PUBLISHED"}
      initial={initial}
      media={mediaList}
      technologies={technologies.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
      }))}
      revisions={revisions.map((r) => ({
        id: r.id,
        version: r.version,
        note: r.note,
        createdAt: r.createdAt,
      }))}
    />
  );
}