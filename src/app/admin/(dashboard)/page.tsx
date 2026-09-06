import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateTime, truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function AdminDashboardPage() {
  const [projects, published, drafts, media, techs, messages, newMessages, recentMessages, revisions, views] =
    await Promise.all([
      db.project.count(),
      db.project.count({ where: { status: "PUBLISHED" } }),
      db.project.count({ where: { status: "DRAFT" } }),
      db.mediaItem.count(),
      db.technology.count(),
      db.contactSubmission.count(),
      db.contactSubmission.count({ where: { status: "NEW" } }),
      db.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      db.revision.count(),
      db.analyticsEvent.count(),
    ]);

  const latest = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      thumbnail: { select: { url: true, kind: true } },
    },
  });

  const stats = [
    { label: "Projects", value: projects, to: "/admin/projects" },
    { label: "Published", value: published, to: "/admin/projects" },
    { label: "Drafts", value: drafts, to: "/admin/projects" },
    { label: "Media files", value: media, to: "/admin/media" },
    { label: "Technologies", value: techs, to: "/admin/technologies" },
    { label: "Messages", value: messages, to: "/admin/messages" },
  ];
  void revisions;
  void views;

  return (
    <>
      <section className="stat-grid">
        {stats.map((s) => (
          <Link key={s.label} href={s.to} className="stat">
            <span className="stat-value">{String(s.value).padStart(2, "0")}</span>
            <span className="stat-label">{s.label.toUpperCase()}</span>
          </Link>
        ))}
      </section>

      <div className="grid-2">
        <section className="card">
          <header className="card-head">
            <h2 className="card-title">RECENTLY EDITED</h2>
            <Link className="card-action" href="/admin/projects">
              All projects →
            </Link>
          </header>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {latest.map((p) => (
                  <tr key={p.id}>
                    <td className="td-thumb">
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail.url} alt="" />
                      ) : (
                        <span className="td-thumb-none">—</span>
                      )}
                    </td>
                    <td>
                      <Link className="link" href={`/admin/projects/${p.id}`}>
                        {truncate(p.title, 40)}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${p.status === "PUBLISHED" ? "badge-green" : p.status === "DRAFT" ? "badge-gray" : "badge-red"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="td-muted">{formatDateTime(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <header className="card-head">
            <h2 className="card-title">
              INBOX
              {newMessages > 0 && <span className="card-count">{newMessages}</span>}
            </h2>
            <Link className="card-action" href="/admin/messages">
              Inbox →
            </Link>
          </header>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {recentMessages.length === 0 && (
                  <tr>
                    <td className="td-muted">No messages yet.</td>
                  </tr>
                )}
                {recentMessages.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className={`dot ${m.status === "NEW" ? "dot-new" : ""}`} />
                    </td>
                    <td>
                      <span className="td-strong">{m.name}</span>
                      <span className="td-sub">{m.subject || "no subject"}</span>
                    </td>
                    <td className="td-muted">{formatDateTime(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}