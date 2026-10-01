"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { PlayIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/locales";
import { formatMonthKey } from "@/lib/dates";
import { t } from "@/lib/localize";
import { urlFor } from "@/sanity/lib/image";
import type { LAYOUT_QUERY_RESULT } from "@/sanity/types";

type Playlist = NonNullable<LAYOUT_QUERY_RESULT["playlist"]>;

/**
 * Black "now playing" capsule (desktop) or green play disc (mobile) that opens
 * the monthly Spotify card on hover, focus or tap.
 */
export function NowPlaying({ playlist, compact = false }: { playlist: Playlist; compact?: boolean }) {
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
  const teaser = artists.length ? `${artists.slice(0, 2).join(", ")}${artists.length > 2 ? "…" : ""}` : title;

  return (
    <div ref={ref} className="now relative" data-open={open}>
      {compact ? (
        <button
          type="button"
          aria-label={tr("open")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-lime text-black"
        >
          <PlayIcon size={12} />
        </button>
      ) : (
        <button
          type="button"
          aria-label={tr("open")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-black py-1.5 pr-5 pl-1.5 text-white"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-lime text-black">
            <PlayIcon />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-xs leading-[14px] opacity-70">
              {tr("label", { month: `${month} ${playlist.month.slice(2, 4)}` })}
            </span>
            <span className="max-w-56 truncate text-base leading-5 font-medium">{teaser}</span>
          </span>
        </button>
      )}

      <aside
        aria-label={tr("card")}
        className={`nowcard absolute top-[calc(100%+8px)] z-30 box-border flex flex-col rounded-md bg-green text-white ${
          compact ? "-right-24 w-[342px] gap-2.5 p-3.5" : "right-0 w-[352px] gap-3 p-4"
        }`}
      >
        <div className={`flex items-center ${compact ? "gap-3" : "gap-3.5"}`}>
          <div
            className={`relative flex shrink-0 items-end overflow-hidden rounded-xs bg-green-dark ${
              compact ? "size-16 p-1.5" : "size-20 p-2"
            }`}
          >
            {playlist.cover?.asset ? (
              <Image
                src={urlFor(playlist.cover).width(160).height(160).url()}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
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
            <span className={`opacity-80 ${compact ? "text-xs leading-[15px]" : "text-[13px] leading-4"}`}>
              {playlist.trackCount ? `TYRŠ · ${tr("tracks", { count: playlist.trackCount })}` : "TYRŠ"}
            </span>
            {!compact && (
              <a href={playlist.spotifyUrl} target="_blank" rel="noopener" className="mt-1.5 text-xs leading-[14px] text-white no-underline opacity-60 hover:opacity-100">
                {tr("save")}
              </a>
            )}
          </div>
          <a
            href={playlist.spotifyUrl}
            target="_blank"
            rel="noopener"
            aria-label={tr("save")}
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white text-black ${
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
                className={`grid items-center border-t border-white/15 ${
                  compact ? "grid-cols-[20px_1fr_auto] gap-2.5 py-2" : "grid-cols-[24px_1fr_auto] gap-3 py-2.5"
                }`}
              >
                <span className={`opacity-60 ${compact ? "text-xs" : "text-[13px]"}`}>{index + 1}</span>
                <span className="flex min-w-0 flex-col">
                  <span className={`truncate font-medium ${compact ? "text-sm leading-[17px]" : "text-[15px] leading-[18px]"}`}>
                    {track.title}
                  </span>
                  <span className={`opacity-70 ${compact ? "text-xs leading-[15px]" : "text-[13px] leading-4"}`}>
                    {track.artist}
                  </span>
                </span>
                {track.url && (
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener"
                    className={`rounded-full border border-white/50 font-medium tracking-[0.04em] text-white uppercase no-underline ${
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

        <div className={`flex items-center justify-between opacity-70 ${compact ? "text-[11px] leading-[14px]" : "pt-1 text-xs leading-[14px]"}`}>
          <span>{tr("ofMonth")}</span>
          <span className="font-semibold tracking-[0.02em]">Spotify</span>
        </div>
      </aside>
    </div>
  );
}
