import { getMediaByIds } from "@/lib/content";
import { parseJson } from "@/lib/validation";
import { MediaAsset } from "@/components/public/MediaAsset";
import { mediaLight } from "@/lib/project-helpers";

type Section = {
  id: string;
  type: string;
  title: string;
  content: string;
  data: string;
};

export function CaseStudy({ sections }: { sections: Section[] }) {
  if (sections.length === 0) {
    return (
      <div className="case-empty">
        <span className="label">CASE STUDY COMING SOON</span>
      </div>
    );
  }

  return (
    <div className="case-study">
      {sections.map((s) => (
        <Block key={s.id} section={s} />
      ))}
    </div>
  );
}

async function Block({ section }: { section: Section }) {
  const data = parseJson<{
    mediaId?: string;
    mediaIds?: string[];
    author?: string;
    items?: Array<{ label?: string; value?: string }>;
    techItems?: string[];
    url?: string;
    right?: string;
  }>(section.data, {});

  switch (section.type) {
    case "heading":
      return (
        <div className="cs-heading">
          <span className="label">{section.title}</span>
          {section.content && <h3 className="cs-heading-text h2">{section.content}</h3>}
        </div>
      );

    case "paragraph":
      return (
        <p className="cs-paragraph lead" data-cursor="">
          {section.content}
        </p>
      );

    case "image":
      return (
        <MediaSection title={section.title} mediaIds={data.mediaId ? [data.mediaId] : []} centered />
      );

    case "fullMedia":
      return (
        <MediaSection title={section.title} mediaIds={data.mediaId ? [data.mediaId] : []} full />
      );

    case "gallery":
      return (
        <MediaSection title={section.title} mediaIds={data.mediaIds ?? []} />
      );

    case "video":
      return <VideoSection mediaId={data.mediaId} title={section.title} />;

    case "quote":
      return (
        <figure className="cs-quote">
          <blockquote className="cs-quote-text h2">{section.content}</blockquote>
          {data.author && <figcaption className="cs-quote-author label">{data.author}</figcaption>}
        </figure>
      );

    case "statistics":
      return (
        <div className="cs-stats">
          <span className="label">{section.title}</span>
          <div className="cs-stats-grid">
            {(data.items ?? []).map((it, i) => (
              <div key={i} className="cs-stat">
                <span className="cs-stat-value h2">{it.value}</span>
                <span className="cs-stat-label label-light">{it.label}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "technologies":
      return (
        <div className="cs-tech">
          <span className="label">{section.title || "STACK"}</span>
          <ul className="cs-tech-list">
            {(data.techItems ?? []).map((it, i) => (
              <li key={i} className="cs-tech-item">
                {it}
              </li>
            ))}
          </ul>
        </div>
      );

    case "twoColumn":
      return (
        <div className="cs-columns">
          <div className="cs-column">
            <span className="label">LEFT</span>
            <p className="cs-column-text">{section.content}</p>
          </div>
          {data.right && (
            <div className="cs-column">
              <span className="label">RIGHT</span>
              <p className="cs-column-text">{data.right}</p>
            </div>
          )}
        </div>
      );

    case "embed":
      return (
        <div className="cs-embed">
          <iframe src={data.url} title="Embedded content" loading="lazy" />
        </div>
      );

    default:
      return null;
  }
}

async function MediaSection({
  mediaIds,
  title,
  centered,
  full,
}: {
  mediaIds: string[];
  title: string;
  centered?: boolean;
  full?: boolean;
}) {
  const media = await getMediaByIds(mediaIds);
  if (media.length === 0) return null;
  return (
    <div className={`cs-media ${centered ? "cs-media-centered" : ""} ${full ? "cs-media-full" : ""}`}>
      {title && <span className="label">{title}</span>}
      <div className={`${media.length > 1 ? "cs-media-grid" : ""}`}>
        {media.map((m) => (
          <figure key={m.id} className="media-frame cs-media-frame">
            <MediaAsset media={mediaLight(m)} fill sizes="(max-width: 1024px) 100vw, 80vw" />
            {m.caption && <figcaption className="cs-caption label-light">{m.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}

async function VideoSection({ mediaId, title }: { mediaId?: string; title?: string }) {
  if (!mediaId) return null;
  const [m] = await getMediaByIds([mediaId]);
  if (!m) return null;
  return (
    <div className="cs-video">
      {title && <span className="label">{title}</span>}
      <video src={m.url} controls playsInline preload="metadata" className="cs-video-player" />
    </div>
  );
}