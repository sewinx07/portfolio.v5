import Image from "next/image";
import { cn } from "@/lib/utils";

type MediaItemLight = {
  id: string;
  url: string;
  kind: string;
  width: number | null;
  height: number | null;
  alt: string;
};

export function MediaAsset({
  media,
  className,
  sizes = "100vw",
  priority = false,
  fill = false,
  animate = true,
}: {
  media: MediaItemLight | null | undefined;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  animate?: boolean;
}) {
  if (!media) {
    return (
      <div className={cn("media-fallback", className)} aria-hidden="true">
        <span>—</span>
      </div>
    );
  }

  if (media.kind === "VIDEO" || media.url.match(/\.(mp4|webm)(\?|$)/)) {
    return (
      <video
        className={cn("media-video", className, animate && "no-anim")}
        src={media.url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={media.alt || "Portfolio media"}
      />
    );
  }

  if (fill) {
    return (
      <Image
        className={cn("media-img", className)}
        src={media.url}
        alt={media.alt || "Portfolio image"}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={media.url.endsWith(".svg")}
      />
    );
  }

  return (
    <Image
      className={cn("media-img", className)}
      src={media.url}
      alt={media.alt || "Portfolio image"}
      width={media.width || 1440}
      height={media.height || 900}
      sizes={sizes}
      priority={priority}
      unoptimized={media.url.endsWith(".svg")}
    />
  );
}