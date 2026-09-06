import { NextResponse } from "next/server";
import { promises as fsp } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const uploadsRoot = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

type Props = { params: Promise<{ path: string[] }> };

export async function GET(_: Request, { params }: Props) {
  const { path: segments } = await params;
  if (!segments.length) return new NextResponse(null, { status: 404 });

  const rel = segments.join(path.sep);
  const full = path.resolve(uploadsRoot, rel);
  if (!full.startsWith(uploadsRoot + path.sep)) {
    return new NextResponse(null, { status: 400 });
  }

  let buf: Buffer;
  try {
    buf = await fsp.readFile(full);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const ext = path.extname(full).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };

  // If an SVG is ever opened directly in a browser tab, lock it down so it
  // can't run scripts. As an <img> it never executes script regardless.
  if (ext === ".svg") {
    headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; sandbox";
  }

  return new NextResponse(new Uint8Array(buf), { headers });
}