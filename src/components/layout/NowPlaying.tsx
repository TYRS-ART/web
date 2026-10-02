"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/locales";
import { formatMonthKey } from "@/lib/dates";
import { t } from "@/lib/localize";
import type { PlaylistArtwork } from "@/lib/spotify";
import { urlFor } from "@/sanity/lib/image";
import type { LAYOUT_QUERY_RESULT } from "@/sanity/types";

import { loadSpotifyApi, spotifyUri, type SpotifyController } from "./spotifyEmbed";

type Playlist = NonNullable<LAYOUT_QUERY_RESULT["playlist"]>;

/** Round cover-art disc with a play (or pause) mark; spins while hovered or playing. */
function CoverDisc({ src, size, icon, playing }: { src?: string; size: string; icon: number; playing: boolean }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime text-black ${size}`}>
      {src && <Image src={src} alt="" fill sizes="48px" className="disc-spin object-cover" />}
      <span
        className={`relative inline-flex items-center justify-center rounded-full ${
          src ? "size-[55%] bg-white/90 shadow-[0_1px_4px_rgba(0,0,0,0.25)]" : ""
        }`}
      >
        {playing ? <PauseIcon size={icon} /> : <PlayIcon size={icon} />}
      </span>
    </span>
  );
}

/**
 * Light "now playing" capsule (desktop) or cover disc (mobile) that opens the
 * monthly Spotify card on hover, focus or tap. Artwork comes from Spotify. The
 * play buttons play right here in Spotify's embedded player (it appears in the
 * card and keeps playing while the card is closed and across pages).
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
  // Embedded Spotify player: what it has loaded and whether it's playing.
  const slot = useRef<HTMLDivElement>(null);
  const controller = useRef<SpotifyController | null>(null);
  const [loaded, setLoaded] = useState<string>();
  const [playing, setPlaying] = useState(false);

  /** Play a playlist/track here; the same one again toggles pause. Falls back to Spotify in a new tab. */
  const play = async (url: string | null | undefined) => {
    const uri = spotifyUri(url);
    if (!url || !uri) return;
    setOpen(true);
    if (controller.current) {
      if (uri === loaded) {
        controller.current.togglePlay();
      } else {
        controller.current.loadUri(uri);
        controller.current.play();
        setLoaded(uri);
      }
      return;
    }
    // First play: load Spotify's player into the card.
    setLoaded(uri);
    try {
      const api = await loadSpotifyApi();
      if (controller.current || !slot.current) return;
      const host = document.createElement("div");
      slot.current.replaceChildren(host);
      api.createController(host, { uri, width: "100%", height: 80 }, (created) => {
        controller.current = created;
        created.addListener("ready", () => created.play());
        created.addListener("playback_update", (event) => setPlaying(!event.data.isPaused));
      });
    } catch {
      // No player (blocked or offline): open Spotify instead.
      setLoaded(undefined);
      window.open(url, "_blank", "noopener");
    }
  };

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
    <div ref={ref} className="now relative" data-open={open} data-playing={playing}>
      {compact ? (
        <button
          type="button"
          aria-label={tr("open")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex cursor-pointer rounded-full border-0 bg-white p-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
        >
          <CoverDisc src={cover} size="size-[38px]" icon={10} playing={playing} />
        </button>
      ) : (
        <button
          type="button"
          aria-label={tr("open")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex cursor-pointer items-center gap-3 rounded-full border-0 bg-white py-1.5 pr-5 pl-1.5 text-black shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-shadow duration-200 hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
        >
          <CoverDisc src={cover} size="size-10" icon={11} playing={playing} />
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
          <button
            type="button"
            onClick={() => (loaded && controller.current ? controller.current.togglePlay() : play(playlist.spotifyUrl))}
            aria-label={playing ? tr("pause") : tr("play")}
            className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-lime text-black transition-colors duration-150 hover:bg-black hover:text-white ${
              compact ? "size-11" : "size-12"
            }`}
          >
            {playing ? <PauseIcon size={compact ? 14 : 16} /> : <PlayIcon size={compact ? 14 : 16} />}
          </button>
        </div>

        {/* Spotify's embedded player, filled in on the first play. */}
        <div ref={slot} className={`overflow-hidden rounded-[12px] [&_iframe]:block ${loaded ? "h-20" : "hidden"}`} />

        {tracks.length > 0 && (
          <ol className="m-0 flex list-none flex-col p-0">
            {tracks.slice(0, compact ? 3 : 4).map((track, index) => {
              const current = loaded !== undefined && spotifyUri(track.url) === loaded;
              return (
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
                  <button
                    type="button"
                    onClick={() => play(track.url)}
                    aria-label={`${current && playing ? tr("pause") : tr("play")}: ${track.title}`}
                    className={`cursor-pointer rounded-full border font-medium tracking-[0.04em] uppercase transition-colors duration-150 hover:border-black hover:bg-black hover:text-white ${
                      current ? "border-black bg-black text-white" : "border-black/25 bg-white text-black"
                    } ${compact ? "px-2 py-[3px] text-[10px] leading-[13px]" : "px-2.5 py-1 text-[11px] leading-[14px]"}`}
                  >
                    {current && playing ? tr("playing") : tr("preview")}
                  </button>
                )}
              </li>
              );
            })}
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
