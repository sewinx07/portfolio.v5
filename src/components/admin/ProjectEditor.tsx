"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProjectAction, saveRevisionAction, restoreRevisionAction } from "@/actions/project-actions";
import type { ProjectPayload } from "@/actions/project-actions";
import { notify } from "@/components/admin/toast";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { PickMedia } from "@/components/admin/MediaPicker";
import { Field, Input, Textarea, Select, SubmitBtn, ActionBtn, Card, StatusBadge, CheckRow, Empty } from "@/components/admin/ui";
import { SECTION_TYPES } from "@/lib/constants";
import { slugify, cn, formatDateTime } from "@/lib/utils";
import { parseJson } from "@/lib/validation";

type Tech = { id: string; name: string; category: string };
type Rev = { id: string; version: number; note: string; createdAt: Date };

type RawSection = {
  type: string;
  title: string;
  content: string;
  data: string;
};

type EditableSection = RawSection & { key: string };

const SECTION_CHOICES = SECTION_TYPES.map((s) => ({ value: s.id, label: s.label }));

function newUid() {
  return Math.random().toString(36).slice(2, 10);
}

function readData<D>(data: string): D {
  return parseJson(data, {}) as D;
}

export function ProjectEditor({
  id,
  slug,
  isNew,
  published,
  initial,
  media,
  technologies,
  revisions,
}: {
  id: string | null;
  slug: string;
  isNew: boolean;
  published: boolean;
  initial: ProjectPayload;
  media: PickMedia[];
  technologies: Tech[];
  revisions: Rev[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<{
    title: string;
    tagline: string;
    category: string;
    year: string;
    client: string;
    role: string;
    shortDescription: string;
    description: string;
    accent: string;
    status: string;
    featured: boolean;
    liveUrl: string;
    githubUrl: string;
    metaTitle: string;
    metaDescription: string;
    thumbnailId: string | null;
    heroMediaId: string | null;
    technologyIds: string[];
    galleryMediaIds: string[];
  }>({
    title: initial.title ?? "",
    tagline: initial.tagline ?? "",
    category: initial.category ?? "",
    year: initial.year ?? "",
    client: initial.client ?? "",
    role: initial.role ?? "",
    shortDescription: initial.shortDescription ?? "",
    description: initial.description ?? "",
    accent: initial.accent ?? "#7C3AED",
    status: initial.status ?? "DRAFT",
    featured: Boolean(initial.featured),
    liveUrl: initial.liveUrl ?? "",
    githubUrl: initial.githubUrl ?? "",
    metaTitle: initial.metaTitle ?? "",
    metaDescription: initial.metaDescription ?? "",
    thumbnailId: initial.thumbnailId ?? null,
    heroMediaId: initial.heroMediaId ?? null,
    technologyIds: initial.technologyIds ?? [],
    galleryMediaIds: initial.galleryMediaIds ?? [],
  });
  const [sections, setSections] = useState<EditableSection[]>(
    (initial.sections ?? []).map((s) => ({
      type: s.type ?? "paragraph",
      title: s.title ?? "",
      content: s.content ?? "",
      data: s.data ?? "{}",
      key: newUid(),
    }))
  );
  const [slugValue, setSlugValue] = useState(slug);
  const [slugTouched, setSlugTouched] = useState(slug !== "");

  const [picker, setPicker] = useState<null | { target: "thumb" | "hero" | "gallery" | "image" | "full" | "gallerySec"; secKey?: string }>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mediaById = useMemo(() => new Map(media.map((m) => [m.id, m])), [media]);

  function onTitleChange(v: string) {
    set("title", v);
    if (!slugTouched) setSlugValue(slugify(v));
  }

  function onSlugChange(v: string) {
    setSlugTouched(true);
    setSlugValue(slugify(v));
  }

  async function save() {
    if (busy) return;
    if (!form.title.trim()) {
      notify("Title is required.", false);
      return;
    }
    if (!slugValue.trim()) {
      notify("Slug is required.", false);
      return;
    }
    setBusy(true);
    const payload: ProjectPayload = {
      ...form,
      slug: slugValue,
      sections: sections.map((s) => ({ type: s.type, title: s.title, content: s.content, data: s.data })),
    };
    const res = await saveProjectAction(id, payload);
    notify(res.message, res.ok);
    setBusy(false);
    if (res.ok && res.data?.id) {
      await router.replace(`/admin/projects/${res.data.id}`);
    } else {
      router.refresh();
    }
  }

  async function saveRevision() {
    if (!id) return;
    const note = prompt("Revision note (optional):")?.trim() ?? "";
    setBusy(true);
    const res = await saveRevisionAction(id, note);
    notify(res.message, res.ok);
    setBusy(false);
    router.refresh();
  }

  async function restoreRevision(revId: string) {
    if (!id) return;
    if (!confirm("Restore this revision? It will overwrite the current draft.")) return;
    setBusy(true);
    const res = await restoreRevisionAction(id, revId);
    notify(res.message, res.ok);
    setBusy(false);
    router.refresh();
  }

  function onMediaPicked(items: PickMedia[]) {
    if (!picker) return;
    const { target, secKey } = picker;
    if (target === "thumb") set("thumbnailId", items[0]?.id ?? null);
    if (target === "hero") set("heroMediaId", items[0]?.id ?? null);
    if (target === "gallery") {
      const existing = form.galleryMediaIds;
      const added = items.map((m) => m.id).filter((i) => !existing.includes(i));
      set("galleryMediaIds", [...existing, ...added]);
    }
    if (target === "image" || target === "full" || target === "gallerySec") {
      const sec = sections.find((s) => s.key === secKey);
      if (sec) {
        const data = readData<Record<string, unknown>>(sec.data);
        if (target === "image" || target === "full") {
          data.mediaId = items[0]?.id ?? null;
        } else {
          data.mediaIds = items.map((m) => m.id);
        }
        updateSection(sec.key, "data", JSON.stringify(data));
      }
    }
    setPicker(null);
  }

  function updateSection(key: string, field: keyof RawSection, value: string) {
    setSections((ss) =>
      ss.map((s) => (s.key === key ? { ...s, [field]: value } : s))
    );
  }

  function addSection(type = "paragraph") {
    setSections((ss) => [
      ...ss,
      { key: newUid(), type, title: "", content: "", data: "{}" },
    ]);
  }

  function moveSection(key: string, dir: -1 | 1) {
    setSections((ss) => {
      const i = ss.findIndex((s) => s.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ss.length) return ss;
      const next = [...ss];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function removeSection(key: string) {
    setSections((ss) => ss.filter((s) => s.key !== key));
  }

  const galleryItems = form.galleryMediaIds.map((mId) => mediaById.get(mId)).filter(Boolean) as PickMedia[];
  const allTechNames = technologies.map((t) => t.name);

  return (
    <>
      <div className="edit-layout">
        <div className="edit-main">
          <Card
            title="IDENTITY"
            actions={isNew ? <StatusBadge status="DRAFT" /> : <StatusBadge status={form.status} />}
          >
            <div className="grid-2">
              <Field label="TITLE" required>
                <Input
                  value={form.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Project title"
                />
              </Field>
              <Field label="SLUG" hint={`URL: /work/${slugValue || "…"}`}>
                <Input
                  value={slugValue}
                  onChange={(e) => onSlugChange(e.target.value)}
                  placeholder="project-slug"
                />
              </Field>
              <Field label="TAGLINE">
                <Input
                  value={form.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  placeholder="Short tagline"
                />
              </Field>
              <Field label="CATEGORY">
                <Input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Web Experience"
                />
              </Field>
              <Field label="YEAR">
                <Input
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                  placeholder="2026"
                />
              </Field>
              <Field label="CLIENT">
                <Input
                  value={form.client}
                  onChange={(e) => set("client", e.target.value)}
                  placeholder="Client name"
                />
              </Field>
              <Field label="ROLE">
                <Input
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="Design, Development, Motion"
                />
              </Field>
              <Field label="ACCENT COLOR">
                <div className="accent-row">
                  <input
                    type="color"
                    value={form.accent}
                    onChange={(e) => set("accent", e.target.value)}
                    className="accent-in"
                  />
                  <Input
                    value={form.accent}
                    onChange={(e) => set("accent", e.target.value)}
                    className="accent-text"
                  />
                </div>
              </Field>
            </div>
            <Field label="SHORT DESCRIPTION" hint="Used on cards and listings (max 500).">
              <Textarea
                rows={2}
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
              />
            </Field>
            <Field label="FULL DESCRIPTION" hint="Editorial intro block of the case study.">
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <Field label="STATUS">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                options={[
                  { value: "DRAFT", label: "Draft" },
                  { value: "PUBLISHED", label: "Published" },
                  { value: "ARCHIVED", label: "Archived" },
                ]}
              />
            </Field>
            <CheckRow
              label="Featured on the homepage world"
              checked={form.featured}
              onChange={(v) => set("featured", v)}
            />
          </Card>

          <Card
            title="MEDIA"
            actions={
              <span className="card-badge">{media.length} files</span>
            }
          >
            <div className="cast-grid">
              <div className="cast">
                <span className="flabel">THUMBNAIL</span>
                <button className="cast-btn" onClick={() => setPicker({ target: "thumb" })}>
                  {form.thumbnailId && mediaById.get(form.thumbnailId) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaById.get(form.thumbnailId)!.url} alt="" />
                  ) : (
                    <span className="cast-empty">+ THUMBNAIL</span>
                  )}
                </button>
              </div>
              <div className="cast">
                <span className="flabel">HERO MEDIA (OPTIONAL)</span>
                <button className="cast-btn" onClick={() => setPicker({ target: "hero" })}>
                  {form.heroMediaId && mediaById.get(form.heroMediaId) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaById.get(form.heroMediaId)!.url} alt="" />
                  ) : (
                    <span className="cast-empty">+ HERO</span>
                  )}
                </button>
              </div>
            </div>

            <div className="gallery-sec">
              <span className="flabel">GALLERY ({galleryItems.length})</span>
              <div className="chips">
                {galleryItems.map((g) => (
                  <div className="chip" key={g.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt={g.alt} />
                    <button
                      className="chip-x"
                      title="Remove"
                      onClick={() =>
                        set(
                          "galleryMediaIds",
                          form.galleryMediaIds.filter((x) => x !== g.id)
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {galleryItems.length === 0 && (
                  <span className="td-muted">No gallery items yet.</span>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPicker({ target: "gallery" })}>
                + ADD GALLERY MEDIA
              </button>
            </div>
          </Card>

          <Card title="CASE STUDY" actions={<span className="card-badge">{sections.length} sections</span>}>
            {sections.map((s, i) => (
              <div className="sec-card" key={s.key}>
                <div className="sec-head">
                  <span className="sec-index">{String(i + 1).padStart(2, "0")}</span>
                  <Select
                    value={s.type}
                    onChange={(e) => updateSection(s.key, "type", e.target.value)}
                    options={SECTION_CHOICES}
                  />
                  <div className="sec-tools">
                    <ActionBtn className="sec-op" onClick={() => moveSection(s.key, -1)} title="Move up">↑</ActionBtn>
                    <ActionBtn className="sec-op" onClick={() => moveSection(s.key, 1)} title="Move down">↓</ActionBtn>
                    <ActionBtn className="sec-op op-danger" onClick={() => removeSection(s.key)} title="Remove">✕</ActionBtn>
                  </div>
                </div>
                <SectionFields
                  section={s}
                  media={media}
                  onChange={(f, v) => updateSection(s.key, f, v)}
                  onPickMedia={() => setPicker({ target: "image", secKey: s.key })}
                />
              </div>
            ))}
            <button className="btn btn-ghost add-sec" onClick={() => addSection()}>
              + ADD SECTION
            </button>
          </Card>

          <Card title="LIVE LINKS">
            <div className="grid-2">
              <Field label="LIVE URL">
                <Input
                  value={form.liveUrl}
                  onChange={(e) => set("liveUrl", e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="SOURCE / REPO URL">
                <Input
                  value={form.githubUrl}
                  onChange={(e) => set("githubUrl", e.target.value)}
                  placeholder="https://…"
                />
              </Field>
            </div>
          </Card>

          <Card title="SEO">
            <div className="grid-2">
              <Field label="META TITLE">
                <Input
                  value={form.metaTitle}
                  onChange={(e) => set("metaTitle", e.target.value)}
                />
              </Field>
              <Field label="META DESCRIPTION">
                <Input
                  value={form.metaDescription}
                  onChange={(e) => set("metaDescription", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card title="BUG REPORTS, CLAIMS & CREDITS">
            <p className="note">
              Placeholders marked like <code>[your client]</code> are fine to keep —
              never invent metrics, clients or awards. Case studies render only what you type here.
            </p>
          </Card>
        </div>

        <aside className="edit-side">
          <Card title="ACTIONS">
            <div className="side-actions">
              <SubmitBtn
                pending={busy ? "SAVING…" : undefined}
                onClick={() => save().catch(() => {})}
              >
                {isNew ? "CREATE PROJECT" : "SAVE CHANGES"}
              </SubmitBtn>
              {!isNew && (
                <>
                  <ActionBtn onClick={saveRevision}>SAVE REVISION</ActionBtn>
                  {published && (
                    <a className="btn btn-ghost" href={`/work/${slug}`} target="_blank" rel="noreferrer">
                      VIEW LIVE ↗
                    </a>
                  )}
                  <a className="btn btn-ghost" href={`/profile/preview`} onClick={(e) => e.preventDefault()}>
                    PREVIEW (BROWSER) ↗
                  </a>
                </>
              )}
              <p className="note">Autosave is manual — press “SAVE CHANGES” to persist.</p>
            </div>
          </Card>

          <Card
            title="TECHNOLOGIES"
            actions={<span className="card-badge">{form.technologyIds.length}</span>}
          >
            <div className="tech-checks">
              {technologies.map((t) => (
                <label className="tech-check" key={t.id}>
                  <input
                    type="checkbox"
                    checked={form.technologyIds.includes(t.id)}
                    onChange={(e) => {
                      const on = e.target.checked;
                      set(
                        "technologyIds",
                        on
                          ? [...form.technologyIds, t.id]
                          : form.technologyIds.filter((x) => x !== t.id)
                      );
                    }}
                  />
                  <span>{t.name}</span>
                </label>
              ))}
              {technologies.length === 0 && (
                <p className="note">
                  Add technologies first in{" "}
                  <a href="/admin/technologies" className="link">Technologies</a>.
                </p>
              )}
            </div>
            <p className="note">{allTechNames.length} in directory</p>
          </Card>

          {!isNew && (
            <Card
              title="REVISIONS"
              actions={<span className="card-badge">{revisions.length}</span>}
            >
              <div className="rev-list">
                {revisions.length === 0 && <Empty title="No snapshots yet" text="Save one to roll back later." />}
                {revisions.map((r) => (
                  <div className="rev-row" key={r.id}>
                    <div className="rev-info">
                      <span className="td-strong">v{r.version}</span>
                      <span className="td-sub">{r.note}</span>
                      <span className="td-muted">{formatDateTime(r.createdAt)}</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => restoreRevision(r.id)}>
                      RESTORE
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>

      <MediaPicker
        media={media}
        open={picker !== null}
        mode={picker?.target === "gallery" || picker?.target === "gallerySec" ? "multi" : "single"}
        onClose={() => setPicker(null)}
        onPick={onMediaPicked}
      />
    </>
  );
}

function SectionFields({
  section,
  media,
  onChange,
  onPickMedia,
}: {
  section: EditableSection;
  media: PickMedia[];
  onChange: (field: "title" | "content" | "data", value: string) => void;
  onPickMedia: () => void;
}) {
  const data = readData<{
    mediaId?: string | null;
    mediaIds?: string[];
    url?: string;
    source?: string;
    right?: string;
    items?: Array<{ value: string; label: string }>;
  }>(section.data);

  const mediaById = useMemo(() => new Map(media.map((m) => [m.id, m])), [media]);

  if (section.type === "heading") {
    return (
      <Field label="HEADING TEXT">
        <Input value={section.title} onChange={(e) => onChange("title", e.target.value)} placeholder="Section heading" />
      </Field>
    );
  }
  if (section.type === "paragraph") {
    return (
      <Field label="PARAGRAPH">
        <Textarea rows={4} value={section.content} onChange={(e) => onChange("content", e.target.value)} placeholder="Body text" />
      </Field>
    );
  }
  if (section.type === "quote") {
    return (
      <div className="stack">
        <Field label="QUOTE TEXT">
          <Textarea rows={3} value={section.content} onChange={(e) => onChange("content", e.target.value)} placeholder="The quote" />
        </Field>
        <Field label="AUTHOR / ROLE">
          <Input value={data.source ?? ""} onChange={(e) => onChange("data", JSON.stringify({ ...data, source: e.target.value }))} placeholder="Name, title" />
        </Field>
      </div>
    );
  }
  if (section.type === "image") {
    const m = data.mediaId ? mediaById.get(data.mediaId) : undefined;
    return (
      <div className="stack">
        <div className="media-sel-row">
          <span className="flabel">IMAGE</span>
          <button className="btn btn-ghost btn-sm" onClick={onPickMedia}>
            {m ? m.filename : "+ CHOOSE IMAGE"}
          </button>
        </div>
        {m && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.url} alt="" className="sec-preview" />
        )}
        <Field label="CAPTION">
          <Input value={section.title} onChange={(e) => onChange("title", e.target.value)} placeholder="Caption" />
        </Field>
      </div>
    );
  }
  if (section.type === "fullMedia") {
    const m = data.mediaId ? mediaById.get(data.mediaId) : undefined;
    return (
      <div className="stack">
        <div className="media-sel-row">
          <span className="flabel">FULL-WIDTH MEDIA</span>
          <button className="btn btn-ghost btn-sm" onClick={onPickMedia}>
            {m ? m.filename : "+ CHOOSE MEDIA"}
          </button>
        </div>
        {m && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.url} alt="" className="sec-preview" />
        )}
      </div>
    );
  }
  if (section.type === "gallery") {
    const items = (data.mediaIds ?? []).map((i) => mediaById.get(i)).filter(Boolean) as PickMedia[];
    return (
      <div className="stack">
        <div className="media-sel-row">
          <span className="flabel">GALLERY ({items.length})</span>
          <button className="btn btn-ghost btn-sm" onClick={onPickMedia}>
            + ADD IMAGES
          </button>
        </div>
        <div className="chips">
          {items.map((g) => (
            <div className="chip" key={g.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.alt} />
              <button
                className="chip-x"
                title="Remove"
                onClick={() =>
                  onChange(
                    "data",
                    JSON.stringify({
                      ...data,
                      mediaIds: items.filter((x) => x.id !== g.id).map((x) => x.id),
                    })
                  )
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (section.type === "video") {
    return (
      <div className="stack">
        <Field label="VIDEO URL" hint="MP4 / WebM file URL or embed source">
          <Input value={data.url ?? ""} onChange={(e) => onChange("data", JSON.stringify({ ...data, url: e.target.value }))} placeholder="https://…/clip.mp4" />
        </Field>
        <Field label="CAPTION">
          <Input value={section.title} onChange={(e) => onChange("title", e.target.value)} placeholder="Caption" />
        </Field>
      </div>
    );
  }
  if (section.type === "embed") {
    return (
      <Field label="EMBED URL" hint="YouTube / Vimeo / iframe video link">
        <Input value={data.url ?? ""} onChange={(e) => onChange("data", JSON.stringify({ ...data, url: e.target.value }))} placeholder="https://youtu.be/…" />
      </Field>
    );
  }
  if (section.type === "statistics") {
    const items = data.items ?? [{ value: "100", label: "" }];
    return (
      <div className="stack">
        <span className="flabel">STATISTICS</span>
        {items.map((it, i) => (
          <div className="stats-row" key={i}>
            <Input
              value={it.value}
              placeholder="Value (e.g. 24)"
              onChange={(e) => {
                const next = items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x));
                onChange("data", JSON.stringify({ ...data, items: next }));
              }}
            />
            <Input
              value={it.label}
              placeholder="Label (e.g. Projects)"
              onChange={(e) => {
                const next = items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x));
                onChange("data", JSON.stringify({ ...data, items: next }));
              }}
            />
            <button
              className="sec-op op-danger"
              onClick={() => {
                const next = items.filter((_, j) => j !== i);
                onChange("data", JSON.stringify({ ...data, items: next }));
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() =>
            onChange("data", JSON.stringify({ ...data, items: [...items, { value: "", label: "" }] }))
          }
        >
          + ADD STAT
        </button>
      </div>
    );
  }
  if (section.type === "technologies") {
    return (
      <p className="note">
        Renders the project&apos;s technology list automatically. No content needed.
      </p>
    );
  }
  if (section.type === "twoColumn") {
    return (
      <div className="stack">
        <Field label="LEFT COLUMN">
          <Textarea rows={4} value={section.content} onChange={(e) => onChange("content", e.target.value)} placeholder="Left column text" />
        </Field>
        <Field label="RIGHT COLUMN">
          <Textarea rows={4} value={data.right ?? ""} onChange={(e) => onChange("data", JSON.stringify({ ...data, right: e.target.value }))} placeholder="Right column text" />
        </Field>
      </div>
    );
  }
  return null;
}