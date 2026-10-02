import { stegaClean } from "next-sanity";

/**
 * Artwork for Spotify links via Spotify's public oEmbed endpoint (no API key).
 * Cached for a day; a missing or failing lookup just means no artwork.
 */
export async function spotifyArtwork(url: string | null | undefined): Promise<string | undefined> {
  if (!url || !/^https:\/\/open\.spotify\.com\//.test(url)) return undefined;
  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      next: { revalidate: 86_400, tags: ["spotify"] },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return undefined;
    const data = (await response.json()) as { thumbnail_url?: string };
    const art = data.thumbnail_url;
    return art && /^https:\/\/(i\.scdn\.co|[a-z0-9-]+\.spotifycdn\.com)\//.test(art) ? art : undefined;
  } catch {
    return undefined;
  }
}

export type PlaylistArtwork = { cover?: string; tracks: Record<string, string> };

/** Playlist cover plus album art per track (keyed by the track's `_key`). */
export async function playlistArtwork(playlist: {
  spotifyUrl: string;
  tracks: Array<{ _key: string; url: string | null }> | null;
}): Promise<PlaylistArtwork> {
  const tracks = playlist.tracks ?? [];
  const [cover, ...arts] = await Promise.all([
    spotifyArtwork(stegaClean(playlist.spotifyUrl)),
    ...tracks.map((track) => spotifyArtwork(stegaClean(track.url))),
  ]);
  return {
    cover,
    tracks: Object.fromEntries(tracks.flatMap((track, i) => (arts[i] ? [[track._key, arts[i]]] : []))),
  };
}
