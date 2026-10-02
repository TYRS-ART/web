"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { PlayIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/locales";
import { formatMonthKey } from "@/lib/dates";
import { t } from "@/lib/localize";
import type { PlaylistArtwork } from "@/lib/spotify";
import { urlFor } from "@/sanity/lib/image";
import type { LAYOUT_QUERY_RESULT } from "@/sanity/types";

type Playlist = NonNullable<LAYOUT_QUERY_RESULT["playlist"]>;

/** Round cover-art disc with a play mark on top; spins slowly while the player is hovered. */
function CoverDisc({ src, size, icon }: { src?: string; size: string; icon: number }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime text-black ${size}`}>
      {src && <Image src={src} alt="" fill sizes="48px" className="disc-spin object-cover" />}
      <span
        className={`relative inline-flex items-center justify-center rounded-full ${
          src ? "size-[55%] bg-white/90 shadow-[0_1px_4px_rgba(0,0,0,0.25)]" : ""
        }`}
      >
        <PlayIcon size={icon} />
      </span>
    </span>
  );
}

/**
 * Light "now playing" capsule (desktop) or cover disc (mobile) that opens the
 * monthly Spotify card on hover, focus or tap. Artwork comes from Spotify.
 */
export function NowPlaying({
  playlist,
  art,
  compact = false,
}: {
  playlist: Playlist;
  art?: PlaylistArtwork;
  compact?: boolean;
}) {
  const locale = useLocale() as Locale;
  const tr = useTranslations("playlist");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const month = formatMonthKey(playlist.month, locale);
  const title = t(playlist.title, locale) ?? tr("ofMonth");
  const tracks = playlist.tracks ?? [];
  const artists = [...new Set(tracks.map((track) => track.artist))];
  // An uploaded cover wins; otherwise Spotify's own playlist artwork.
  const cover = playlist.cover?.asset ? urlFor(playlist.cover).width(160).height(160).url() : art?.cover;
  const teaser = artists.length ? `${artists.slice(0, 2).join(", ")}${artists.length > 2 ? "…" : ""}` : title;

  return (
    <div ref={ref} className="now relative" data-open={open}>
      {compact ? (
        <button
          type="button"
          aria-label={tr("open")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex cursor-pointer rounded-full border-0 bg-white p-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
        >
          <CoverDisc src={cover} size="size-[38px]" icon={10} />
        </button>
      ) : (
        <button
          type="button"
          aria-label={tr("open")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex cursor-pointer items-center gap-3 rounded-full border-0 bg-white py-1.5 pr-5 pl-1.5 text-black shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-shadow duration-200 hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
        >
          <CoverDisc src={cover} size="size-10" icon={11} />
          <span className="flex flex-col text-left">
            <span className="text-xs leading-[14px] text-muted">
              {tr("label", { month: `${month} ${playlist.month.slice(2, 4)}` })}
            </span>
            <span className="max-w-56 truncate text-base leading-5 font-medium">{teaser}</span>
          </span>
        </button>
      )}

      <aside
        aria-label={tr("card")}
        className={`nowcard absolute top-[calc(100%+8px)] z-30 box-border flex flex-col rounded-md bg-white text-black shadow-[0_12px_40px_rgba(0,0,0,0.14)] ${
          compact ? "-right-24 w-[342px] gap-2.5 p-3.5" : "right-0 w-[352px] gap-3 p-4"
        }`}
      >
        <div className={`flex items-center ${compact ? "gap-3" : "gap-3.5"}`}>
          <div
            className={`relative flex shrink-0 items-end overflow-hidden rounded-xs bg-green ${
              compact ? "size-16 p-1.5" : "size-20 p-2"
            }`}
          >
            {cover ? (
              <Image src={cover} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <span className={`font-display text-white ${compact ? "text-xs leading-3" : "text-sm leading-[14px]"}`}>
                {title}
              </span>
            )}
          </div>
          <div className="flex min-w-0 grow flex-col gap-1">
            <span className={`truncate font-semibold ${compact ? "text-base leading-5" : "text-lg leading-[22px]"}`}>
              {title}
            </span>
            <span className={`text-muted ${compact ? "text-xs leading-[15px]" : "text-[13px] leading-4"}`}>
              {playlist.trackCount ? `TYRŠ · ${tr("tracks", { count: playlist.trackCount })}` : "TYRŠ"}
            </span>
            {!compact && (
              <a href={playlist.spotifyUrl} target="_blank" rel="noopener" className="mt-1.5 text-xs leading-[14px] text-muted no-underline hover:text-black">
                {tr("save")}
              </a>
            )}
          </div>
          <a
            href={playlist.spotifyUrl}
            target="_blank"
            rel="noopener"
            aria-label={tr("save")}
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-lime text-black transition-colors duration-150 hover:bg-black hover:text-white ${
              compact ? "size-11" : "size-12"
            }`}
          >
            <PlayIcon size={compact ? 14 : 16} />
          </a>
        </div>

        {tracks.length > 0 && (
          <ol className="m-0 flex list-none flex-col p-0">
            {tracks.slice(0, compact ? 3 : 4).map((track, index) => (
              <li
                key={track._key}
                className={`grid items-center border-t border-black/10 ${
                  compact ? "grid-cols-[36px_1fr_auto] gap-2.5 py-2" : "grid-cols-[40px_1fr_auto] gap-3 py-2"
                }`}
              >
                <span
                  className={`relative inline-flex items-center justify-center overflow-hidden rounded-[4px] bg-sunken text-muted ${
                    compact ? "size-9 text-xs" : "size-10 text-[13px]"
                  }`}
                >
                  {art?.tracks[track._key] ? (
                    <Image src={art.tracks[track._key]} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className={`truncate font-medium ${compact ? "text-sm leading-[17px]" : "text-[15px] leading-[18px]"}`}>
                    {track.title}
                  </span>
                  <span className={`truncate text-muted ${compact ? "text-xs leading-[15px]" : "text-[13px] leading-4"}`}>
                    {track.artist}
                  </span>
                </span>
                {track.url && (
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener"
                    className={`rounded-full border border-black/25 font-medium tracking-[0.04em] text-black uppercase no-underline transition-colors duration-150 hover:border-black hover:bg-black hover:text-white ${
                      compact ? "px-2 py-[3px] text-[10px] leading-[13px]" : "px-2.5 py-1 text-[11px] leading-[14px]"
                    }`}
                  >
                    {tr("preview")}
                  </a>
                )}
              </li>
            ))}
          </ol>
        )}

        <div className={`flex items-center justify-between text-muted ${compact ? "text-[11px] leading-[14px]" : "pt-1 text-xs leading-[14px]"}`}>
          <span>{tr("ofMonth")}</span>
          <span className="font-semibold tracking-[0.02em]">Spotify</span>
        </div>
      </aside>
    </div>
  );
}
