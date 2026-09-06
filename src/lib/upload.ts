import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { db } from "@/lib/db";
import type { MediaKind } from "@prisma/client";

export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

export const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const IMAGE_MAX_EDGE = 2400;
const IMAGE_QUALITY = 82;

export type UploadResult = {
  filename: string;
  url: string;
  kind: MediaKind;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
};

const uploadRoot = path.join(process.cwd(), "public", "uploads");

function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ]/g, "").trim().replace(/\s+/g, "-");
  return base || "file";
}

export async function processUpload(file: File): Promise<UploadResult> {
  const originalName = sanitizeFilename(file.name);
  const mime = file.type || "";
  const size = file.size;

  if (size <= 0 || size > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.`);
  }

  const isSvg = mime === "image/svg+xml" || originalName.toLowerCase().endsWith(".svg");
  const isImage = ALLOWED_IMAGE_MIME.has(mime) && !isSvg;
  const isVideo = ALLOWED_VIDEO_MIME.has(mime);

  if (!isSvg && !isImage && !isVideo) {
    throw new Error("Unsupported file type. Allowed: JPG, PNG, WebP, AVIF, GIF, SVG, MP4, WebM.");
  }

  const buf = Buffer.from(await file.arrayBuffer());

  if (isSvg) {
    // Basic SVG safety: reject scripts/foreign objects.
    const text = buf.toString("utf8");
    if (/<script/i.test(text) || /onload\s*=/i.test(text) || /javascript:/i.test(text)) {
      throw new Error("Unsafe SVG rejected.");
    }
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dir = path.join(uploadRoot, month);
  await fs.mkdir(dir, { recursive: true });

  const ext = isSvg ? "svg" : isVideo ? (mime === "video/webm" ? "webm" : "mp4") : "webp";
  const random = crypto.randomBytes(6).toString("hex");
  const filename = `${random}-${path.basename(originalName, path.extname(originalName)).toLowerCase().slice(0, 40)}.${ext}`;
  const dest = path.join(dir, filename);
  const url = `/uploads/${month}/${filename}`;

  let width: number | null = null;
  let height: number | null = null;
  let outSize = buf.length;

  if (isSvg || isVideo) {
    await fs.writeFile(dest, buf);
  } else {
    let pipeline = sharp(buf, { animated: mime === "image/gif" });
    const meta = await pipeline.metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;

    if (mime !== "image/gif") {
      if (width && width > IMAGE_MAX_EDGE) {
        pipeline = pipeline.resize({ width: IMAGE_MAX_EDGE, withoutEnlargement: true });
        width = null; // recalc below if needed
      }
      const resized = await pipeline
        .webp({ quality: IMAGE_QUALITY, effort: 4 })
        .toBuffer();
      await fs.writeFile(dest, resized);
      outSize = resized.length;
      const meta2 = await sharp(resized).metadata();
      width = meta2.width ?? width;
      height = meta2.height ?? height;
    } else {
      // GIF: keep original (animate for the rare case)
      await fs.writeFile(dest, buf);
    }
  }

  return {
    filename,
    url,
    kind: isSvg ? "SVG" : isVideo ? "VIDEO" : "IMAGE",
    mimeType: mime,
    size: outSize,
    width,
    height,
  };
}

export async function deleteUploadFile(url: string) {
  const safe = path.normalize(url).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(process.cwd(), "public", safe);
  if (full.startsWith(uploadRoot)) {
    await fs.unlink(full).catch(() => {});
  }
}

export async function createMediaFromUpload(file: File) {
  const data = await processUpload(file);
  return db.mediaItem.create({
    data: {
      filename: data.filename,
      url: data.url,
      kind: data.kind,
      mimeType: data.mimeType,
      size: data.size,
      width: data.width,
      height: data.height,
    },
  });
}