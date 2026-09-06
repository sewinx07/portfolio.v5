import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="nf">
      <div className="container nf-inner">
        <span className="label">ERROR — 404</span>
        <h1 className="nf-title h1">THIS SCENE DOESN'T EXIST.</h1>
        <p className="lead">The page you're looking for was cut from the edit.</p>
        <Link className="btn btn-solid" href="/">BACK TO THE START</Link>
      </div>
    </main>
  );
}