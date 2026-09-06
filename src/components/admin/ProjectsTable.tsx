"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleFeaturedAction, duplicateProjectAction, deleteProjectAction, reorderProjectsAction, setProjectStatusAction } from "@/actions/project-actions";
import { notify } from "@/components/admin/toast";
import { cn, formatDateTime } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  slug: string;
  category: string;
  year: string;
  status: string;
  featured: boolean;
  order: number;
  updatedAt: Date;
  thumbnail: { url: string; kind: string } | null;
};

export function ProjectsTable({ projects }: { projects: Row[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const busy = (id: string, op: string) => pending !== null;

  async function run(id: string, op: string, fn: () => Promise<{ ok: boolean; message: string }>) {
    if (pending) return;
    setPending(`${id}:${op}`);
    const res = await fn();
    notify(res.message, res.ok);
    setPending(null);
    router.refresh();
  }

  function reorder(id: string, dir: -1 | 1) {
    const idx = projects.findIndex((p) => p.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= projects.length) return;
    const next = [...projects];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    const orderedIds = next.map((p) => p.id);
    startTransition(() => {
      reorderProjectsAction(orderedIds).then((res) => {
        notify(res.message, res.ok);
        router.refresh();
      });
    });
  }

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th />
              <th>PROJECT</th>
              <th>CATEGORY / YEAR</th>
              <th>STATUS</th>
              <th>FEATURED</th>
              <th>UPDATED</th>
              <th className="th-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <tr key={p.id}>
                <td className="td-thumb">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail.url} alt="" />
                  ) : (
                    <span className="td-thumb-none">—</span>
                  )}
                </td>
                <td className="td-main">
                  <Link className="link" href={`/admin/projects/${p.id}`}>
                    {p.title}
                  </Link>
                  <span className="td-sub">/{p.slug}</span>
                </td>
                <td className="td-muted">
                  <span className="td-row-cat">{p.category}</span>
                  <span className="td-sub">{p.year}</span>
                </td>
                <td>
                  <form
                    action={() => run(p.id, "status", () => setProjectStatusAction(p.id, p.status === "PUBLISHED" ? "DRAFT" : p.status === "ARCHIVED" ? "PUBLISHED" : "PUBLISHED"))}
                  >
                    <button className="status-toggle" title="Toggle status" type="submit" disabled={busy(p.id, "status")}>
                      <span className={cn("badge", p.status === "PUBLISHED" ? "badge-green" : p.status === "DRAFT" ? "badge-gray" : "badge-red")}>
                        {p.status}
                      </span>
                    </button>
                  </form>
                </td>
                <td>
                  <button
                    className={cn("star", p.featured && "star-on")}
                    title={p.featured ? "Remove from featured" : "Feature this project"}
                    disabled={busy(p.id, "featured")}
                    onClick={() => run(p.id, "featured", () => toggleFeaturedAction(p.id, !p.featured))}
                  >
                    ★
                  </button>
                </td>
                <td className="td-muted">{formatDateTime(p.updatedAt)}</td>
                <td className="td-actions">
                  <div className="row-ops">
                    <button
                      className="row-op"
                      title="Move up"
                      disabled={i === 0 || pending !== null}
                      onClick={() => reorder(p.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      className="row-op"
                      title="Move down"
                      disabled={i === projects.length - 1 || pending !== null}
                      onClick={() => reorder(p.id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      className="row-op"
                      title="Duplicate"
                      disabled={busy(p.id, "dup")}
                      onClick={() => run(p.id, "dup", () => duplicateProjectAction(p.id))}
                    >
                      ⧉
                    </button>
                    <button
                      className="row-op op-danger"
                      title="Delete"
                      disabled={busy(p.id, "del")}
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
                          run(p.id, "del", () => deleteProjectAction(p.id));
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}