"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import { SanityImage, type SanityImageValue } from "@/components/ui/SanityImage";

export type HousePhoto = SanityImageValue & { _key: string; alt: string };

type Labels = {
  title: string;
  all: string;
  /** "Photo 1 of 22" for each tile shown in the card. */
  open: string[];
  more: string;
  close: string;
  prev: string;
  next: string;
};

/** How many photos the card shows; the rest are a click away in the viewer. */
const VISIBLE = 4;

/**
 * White card with photos of the house, two per row. The fourth tile says how many more there
 * are; any tile opens a full-screen viewer to flip through all of them (arrows, keys, swipe).
 */
export function HousePhotos({ photos, labels }: { photos: HousePhoto[]; labels: Labels }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const swipeStart = useRef<number | null>(null);

  const open = index !== null;
  const count = photos.length;
  const shown = photos.slice(0, VISIBLE);
  const hidden = count - shown.length;
  // A lone first photo (1 or 3 in the card) takes the full width.
  const wideFirst = shown.length % 2 === 1;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const step = (by: number) => setIndex((i) => (i === null ? i : (i + by + count) % count));

  function onPointerUp(event: PointerEvent) {
    if (swipeStart.current === null) return;
    const dx = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }

  if (count === 0) return null;
  const current = index === null ? undefined : photos[index];
  const round =
    "inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-white text-xl text-black lg:size-14";

  return (
    <>
      <div className="-mx-2 grid grid-cols-2 gap-2.5 rounded-tile bg-white p-3 lg:mx-0 lg:gap-4 lg:rounded-card lg:p-6">
        <div className="col-span-full flex items-baseline justify-between gap-4">
          <h2 className="m-0 text-[15px] leading-5 font-medium text-muted lg:text-lg lg:leading-6">{labels.title}</h2>
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setIndex(0)}
              className="cursor-pointer border-0 bg-transparent p-0 text-[15px] leading-5 font-medium text-black hover:text-green lg:text-lg lg:leading-6"
            >
              {labels.all}
            </button>
          )}
        </div>
        {shown.map((photo, i) => {
          const wide = wideFirst && i === 0;
          const last = hidden > 0 && i === shown.length - 1;
          return (
            <button
              key={photo._key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={last ? `${labels.open[i]}, ${labels.more}` : labels.open[i]}
              className={`tile group relative block cursor-zoom-in overflow-hidden rounded-[14px] border-0 bg-sunken p-0 lg:rounded-tile ${
                wide ? "col-span-2 h-[260px] lg:h-[520px]" : "aspect-square lg:aspect-auto lg:h-[400px]"
              }`}
            >
              <span className="soft absolute inset-0 overflow-hidden">
                <SanityImage
                  image={photo}
                  alt={photo.alt}
                  fill
                  sizes={wide ? "(min-width: 1024px) 80vw, 100vw" : "(min-width: 1024px) 40vw, 50vw"}
                  className="object-cover zoom-soft group-hover:scale-[1.04] motion-reduce:transition-none"
                />
              </span>
              {last && (
                <span
                  aria-hidden="true"
                  className="soft absolute inset-0 flex items-center justify-center bg-black/45 font-display text-[40px] leading-10 text-white lg:text-[64px] lg:leading-[64px]"
                >
                  +{hidden}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onClick={(event) => {
          // A click on the dark area around the photo closes the viewer.
          if (event.target === event.currentTarget) setIndex(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
        aria-label={labels.title}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/92 p-0 text-white backdrop:bg-black/40"
      >
        {current && (
          <div
            className="flex h-full touch-pan-y flex-col items-center justify-center gap-4 px-4 py-20 lg:px-24"
            onPointerDown={(event) => (swipeStart.current = event.clientX)}
            onPointerUp={onPointerUp}
            onClick={(event) => {
              if (event.target === event.currentTarget) setIndex(null);
            }}
          >
            <div className="relative h-full w-full">
              <SanityImage
                key={current._key}
                image={current}
                alt={current.alt}
                fill
                sizes="100vw"
                className="rounded-tile object-contain"
              />
            </div>
            <p aria-live="polite" className="m-0 text-base leading-6 opacity-80">
              {index! + 1} / {count}
            </p>
          </div>
        )}
        <button type="button" onClick={() => setIndex(null)} aria-label={labels.close} className={`absolute top-4 right-4 lg:top-6 lg:right-6 ${round}`}>
          ✕
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={labels.prev}
              className={`absolute bottom-4 left-4 lg:top-1/2 lg:bottom-auto lg:left-6 lg:-translate-y-1/2 ${round}`}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={labels.next}
              className={`absolute right-4 bottom-4 lg:top-1/2 lg:right-6 lg:bottom-auto lg:-translate-y-1/2 ${round}`}
            >
              →
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
