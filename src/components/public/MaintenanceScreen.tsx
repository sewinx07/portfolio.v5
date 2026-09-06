export function MaintenanceScreen({ brand }: { brand: string }) {
  return (
    <main className="mnt" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="mnt-inner" style={{ maxWidth: 560, textAlign: "center" }}>
        <span className="label">SITE LOG — UNDER CONSTRUCTION</span>
        <h1 className="mnt-title h1" style={{ textTransform: "uppercase" }}>
          COMING SOON.
        </h1>
        <p className="lead mnt-sub">
          The studio is quietly working on something new for {brand}. Check back soon.
        </p>
      </div>
    </main>
  );
}