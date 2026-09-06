"use client";

import { useTransition } from "@/components/public/TransitionProvider";
import { MediaAsset } from "@/components/public/MediaAsset";
import type { HeroCard } from "@/lib/project-helpers";

export function NextProject({
  project,
  index,
  total,
}: {
  project: HeroCard | null;
  index: number;
  total: number;
}) {
  const { navigate } = useTransition();
  return (
    <aside className="next-project">
      <div className="container">
        <span className="label">NEXT PROJECT — {total > 0 ? `0${((index + 1) % total) + 1}` : ""}</span>
        {project ? (
          <button
            className="next-project-main"
            onClick={() => navigate(`/work/${project.slug}`)}
            data-cursor="NEXT"
            aria-label={`Open ${project.title}`}
          >
            <span className="next-title h1">{project.title}</span>
            <div className="next-media media-frame">
              <MediaAsset media={project.thumbnail} fill sizes="60vw" />
            </div>
            <span className="next-arrow">→</span>
          </button>
        ) : (
          <div className="next-project-main">
            <span className="next-end label">END OF THE WORK</span>
          </div>
        )}
      </div>
    </aside>
  );
}