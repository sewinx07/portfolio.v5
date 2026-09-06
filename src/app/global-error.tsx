"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#F4F2EE", color: "#0a0a0b", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ maxWidth: 520, textAlign: "center" }}>
            <p style={{ fontSize: 12, letterSpacing: 6, color: "#6b6d70", textTransform: "uppercase" }}>
              Error{error.digest ? ` #${error.digest}` : ""}
            </p>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: -2, lineHeight: 1, textTransform: "uppercase", margin: "16px 0" }}>
              A glitch in the feed.
            </h1>
            <p style={{ fontSize: 16, color: "#3a3c40" }}>
              Something interrupted this scene. Try again, or start from the top.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
              <button
                onClick={() => reset()}
                style={{ padding: "12px 20px", border: "1px solid #0a0a0b", background: "#0a0a0b", color: "#F4F2EE", cursor: "pointer", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}