"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="nf" role="alert">
      <div className="container nf-inner">
        <span className="label">ERROR — {error.digest ? `#${error.digest}` : "SOMETHING WENT WRONG"}</span>
        <h1 className="nf-title h1">A GLITCH IN THE FEED.</h1>
        <p className="lead">
          Something interrupted this scene. Try again, or head back to the start.
        </p>
        <div className="nf-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn btn-solid" onClick={() => reset()}>
            TRY AGAIN
          </button>
          <Link className="btn btn-ghost" href="/">
            BACK TO THE START
          </Link>
        </div>
      </div>
    </main>
  );
}