"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateMediaAction, deleteMediaAction } from "@/actions/media-actions";
import { notify } from "@/components/admin/toast";
import { formatBytes, cn } from "@/lib/utils";

type MediaRow = {
  id: string;
  filename: string;
  url: string;
  kind: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string;
};

export function MediaLibrary({ initial }: { initial: MediaRow[] }) {
  const router = useRouter();
  const [media, setMedia] = useState<MediaRow[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [copy, setCopy] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          notify(data?.error ?? "Upload failed.", false);
        } else {
          setMedia((m) => [data.media, ...m]);
          notify(`Uploaded ${data.media.filename}`, true);
        }
      } catch {
        notify("Upload failed.", false);
      }
    }
    setUploading(false);
    router.refresh();
  }

  async function saveField(m: MediaRow, field: "alt" | "caption" | "filename", value: string) {
    const res = await updateMediaAction(m.id, { [field]: value });
    notify(res.message, res.ok);
    setMedia((list) =>
      list.map((x) => (x.id === m.id ? { ...x, [field]: value } : x))
    );
  }

  async function remove(m: MediaRow) {
    if (!confirm(`Delete "${m.filename}"?`)) return;
    const res = await deleteMediaAction(m.id);
    notify(res.message, res.ok);
    if (res.ok) setMedia((list) => list.filter((x) => x.id !== m.id));
    router.refresh();
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopy(url);
      setTimeout(() => setCopy(null), 1200);
    } catch {
      /* ignore */
    }
  }

  const filtered = media.filter((m) => filter === "ALL" || m.kind === filter);

  return (
    <>
      <div
        className={`upload-zone${dragOver ? " drag" : ""}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*,.svg"
          hidden
          onChange={(e) => upload(e.target.files)}
        />
        <span className="upload-plus">+</span>
        <span className="upload-title">
          {uploading ? "PROCESSING…" : dragOver ? "RELEASE TO UPLOAD" : "DROP FILES TO UPLOAD"}
        </span>
        <span className="upload-sub">
          JPG · PNG · WebP · AVIF · GIF · SVG · MP4 — processed to ≤2400px WebP · 30MB max
        </span>
      </div>

      <div className="media-filters">
        {["ALL", "IMAGE", "VIDEO", "SVG"].map((k) => {
          const count = k === "ALL" ? media.length : media.filter((m) => m.kind === k).length;
          return (
            <button
              key={k}
              className={cn("pk", filter === k && "active")}
              onClick={() => setFilter(k)}
            >
              {k} <span className="pk-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="library-grid">
        {filtered.map((m) => (
          <div className="lib-cell card" key={m.id}>
            <div className="lib-media">
              {m.kind === "VIDEO" ? (
                <video src={m.url} muted playsInline preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.alt} />
              )}
              {m.kind === "SVG" && <span className="pk-badge lib-badge">SVG</span>}
            </div>
            <div className="lib-body">
              <span className="td-sub trunc" title={m.filename}>
                {m.filename}
              </span>
              <span className="td-muted">
                {m.width && m.height ? `${m.width}×${m.height} · ` : ""}
                {formatBytes(m.size)}
              </span>
              <input
                className="input lib-in"
                defaultValue={m.alt}
                placeholder="Alt text"
                onBlur={(e) => {
                  if (e.target.value !== m.alt) saveField(m, "alt", e.target.value);
                }}
              />
              <input
                className="input lib-in"
                defaultValue={m.caption}
                placeholder="Caption"
                onBlur={(e) => {
                  if (e.target.value !== m.caption) saveField(m, "caption", e.target.value);
                }}
              />
              <div className="lib-ops">
                <button className="btn btn-ghost btn-sm" onClick={() => copyUrl(m.url)}>
                  {copy === m.url ? "COPIED" : "COPY URL"}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>
                  DELETE
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty" style={{ marginTop: 24 }}>
          <span className="empty-title">No files</span>
        </div>
      )}
    </>
  );
}