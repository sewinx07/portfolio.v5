import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { ProjectsTable } from "@/components/admin/ProjectsTable";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false },
};

export default async function AdminProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    include: {
      thumbnail: { select: { url: true, kind: true } },
      technologies: { include: { technology: true } },
    },
  });

  const archived = projects.filter((p) => p.status === "ARCHIVED").length;
  void archived;

  return (
    <>
      <div className="page-actions">
        <span className="page-actions-count">{projects.length} total</span>
        <Link className="btn btn-primary" href="/admin/projects/new">
          + NEW PROJECT
        </Link>
      </div>
      <ProjectsTable projects={projects} />
    </>
  );
}