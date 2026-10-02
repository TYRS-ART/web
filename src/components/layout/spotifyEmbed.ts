/**
 * Spotify's official iFrame API: plays a playlist or track in an embedded player
 * on the page. The script loads only when someone presses play. Signed-in Spotify
 * listeners hear whole tracks, everyone else 30-second previews (Spotify's rule).
 */

export type SpotifyController = {
  loadUri(uri: string): void;
  play(): void;
  togglePlay(): void;
  addListener(event: "ready", callback: () => void): void;
  addListener(event: "playback_update", callback: (event: { data: { isPaused: boolean } }) => void): void;
};

type SpotifyIFrameAPI = {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyController) => void,
  ): void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

let api: Promise<SpotifyIFrameAPI> | undefined;

export function loadSpotifyApi(): Promise<SpotifyIFrameAPI> {
  api ??= new Promise<SpotifyIFrameAPI>((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      api = undefined;
      script.remove();
      reject(new Error("Spotify player failed to load"));
    };
    document.body.appendChild(script);
  });
  return api;
}

/** "https://open.spotify.com/playlist/37i9…?si=…" → "spotify:playlist:37i9…". */
export function spotifyUri(url: string | null | undefined): string | undefined {
  const match = url?.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|track|album|episode)\/([A-Za-z0-9]+)/);
  return match ? `spotify:${match[1]}:${match[2]}` : undefined;
}
