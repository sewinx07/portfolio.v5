import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [total, projects, viewsByDay, topProjects, referrers, devices, recent] = await Promise.all([
    db.analyticsEvent.count(),
    db.analyticsEvent.count({ where: { kind: "PROJECT_VIEW" } }),
    db.$queryRawUnsafe<string>(`
      SELECT date(createdAt) as day, count(*) as c
      FROM AnalyticsEvent
      GROUP BY day ORDER BY day DESC LIMIT 14
    `),
    db.analyticsEvent.groupBy({
      by: ["projectSlug"],
      where: { projectSlug: { not: "" } },
      _count: { _all: true },
      orderBy: { _count: { projectSlug: "desc" } },
      take: 8,
    }),
    db.analyticsEvent.groupBy({
      by: ["referrer"],
      _count: { _all: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 6,
    }),
    db.analyticsEvent.groupBy({
      by: ["device"],
      _count: { _all: true },
      orderBy: { _count: { device: "desc" } },
    }),
    db.analyticsEvent.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const dayRows = (viewsByDay as unknown as Array<{ day: string; c: number }>).map((r) => ({
    day: r.day,
    count: Number(r.c),
  }));

  const maxDay = Math.max(1, ...dayRows.map((r) => r.count));

  return (
    <div className="stack">
      <div className="stat-grid">
        <div className="stat"><span className="stat-value">{total}</span><span className="stat-label">ALL EVENTS</span></div>
        <div className="stat"><span className="stat-value">{projects}</span><span className="stat-label">PROJECT VIEWS</span></div>
        <div className="stat"><span className="stat-value">{devices.length}</span><span className="stat-label">DEVICE TYPES</span></div>
      </div>

      <section className="card">
        <header className="card-head"><h2 className="card-title">VIEWS — LAST 14 DAYS</h2></header>
        <div className="bars">
          {dayRows.map((r) => (
            <div className="bar" key={r.day} title={`${r.day}: ${r.count}`}>
              <div className="bar-fill" style={{ height: `${Math.round((r.count / maxDay) * 100)}%` }} />
              <span className="bar-day">{String(r.day).slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <header className="card-head"><h2 className="card-title">TOP PROJECTS</h2></header>
          <table className="table">
            <tbody>
              {topProjects.map((p) => (
                <tr key={p.projectSlug}>
                  <td>/{p.projectSlug}</td>
                  <td className="td-right">{p._count._all}</td>
                </tr>
              ))}
              {topProjects.length === 0 && (
                <tr><td className="td-muted">No project views yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
        <section className="card">
          <header className="card-head"><h2 className="card-title">REFERRERS</h2></header>
          <table className="table">
            <tbody>
              {referrers.map((r) => (
                <tr key={r.referrer || "direct"}>
                  <td>{r.referrer || "(direct)"}</td>
                  <td className="td-right">{r._count._all}</td>
                </tr>
              ))}
              {referrers.length === 0 && (
                <tr><td className="td-muted">No referrers yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}