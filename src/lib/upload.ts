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
  buffer: Buffer;
};

function sanitizeFilename(name: string): string {
  const base = pathBasename(name).replace(/[^\w.\- ]/g, "").trim().replace(/\s+/g, "-");
  return base || "file";
}

// Small shim so the filename never resolves through a filesystem path.
function pathBasename(name: string): string {
  const i = Math.max(name.lastIndexOf("/"), name.lastIndexOf("\\"));
  return i >= 0 ? name.slice(i + 1) : name;
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

  const random = crypto.randomBytes(6).toString("hex");
  const nameBase = pathBasename(originalName);
  const base = nameBase.slice(0, nameBase.lastIndexOf(".")) || nameBase;
  const ext = isSvg ? "svg" : isVideo ? (mime === "video/webm" ? "webm" : "mp4") : "webp";
  const filename = `${random}-${base.toLowerCase().slice(0, 40)}.${ext}`;

  let width: number | null = null;
  let height: number | null = null;
  let outBuf: Buffer = buf;
  let outSize = buf.length;

  if (isSvg || isVideo) {
    outBuf = buf;
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
      outBuf = resized;
      outSize = resized.length;
      const meta2 = await sharp(resized).metadata();
      width = meta2.width ?? width;
      height = meta2.height ?? height;
    }
  }

  return {
    filename,
    url: "", // filled by createMediaFromUpload once the row exists
    kind: isSvg ? "SVG" : isVideo ? "VIDEO" : "IMAGE",
    mimeType: mime,
    size: outSize,
    width,
    height,
    buffer: outBuf,
  };
}

export async function deleteUploadFile(url: string) {
  // Media bytes live in the database (MediaItem.data); nothing to remove on disk.
  void url;
}

export async function createMediaFromUpload(file: File) {
  const data = await processUpload(file);
  const row = await db.mediaItem.create({
    data: {
      filename: data.filename,
      url: "",
      data: data.buffer as unknown as Uint8Array<ArrayBuffer>,
      kind: data.kind,
      mimeType: data.mimeType,
      size: data.size,
      width: data.width,
      height: data.height,
    },
    select: {
      id: true,
      filename: true,
      kind: true,
      mimeType: true,
      size: true,
      width: true,
      height: true,
      alt: true,
      caption: true,
      uploadedAt: true,
    },
  });
  const url = `/media/${row.id}`;
  await db.mediaItem.update({ where: { id: row.id }, data: { url }, select: { id: true } });
  return { ...row, url };
}