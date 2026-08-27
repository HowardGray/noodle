export type Track = { id: string; title: string; file: string };

const KEY = "noodle.track";
let el: HTMLAudioElement | null = null;
let tracks: Track[] = [];
let current: string | null = null;

/**
 * Tracks are generated ahead of time and committed as files — a static site
 * cannot call a music API at runtime without publishing the API key.
 * See scripts/make-music.mjs.
 */
export async function loadTracks(base: string): Promise<Track[]> {
  try {
    const res = await fetch(`${base}music/tracks.json`, { cache: "no-cache" });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    const list = (data as { tracks?: unknown }).tracks;
    tracks = Array.isArray(list) ? (list as Track[]).filter((t) => t && t.id && t.file) : [];
  } catch {
    tracks = [];
  }
  return tracks;
}

export function saved(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function currentId() {
  return current;
}

export function select(base: string, id: string | null) {
  current = id;
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    /* private browsing */
  }

  if (!id) {
    el?.pause();
    return;
  }
  const track = tracks.find((t) => t.id === id);
  if (!track) return;

  if (!el) {
    el = new Audio();
    el.loop = true;
    el.volume = 0.42;
  }
  const src = `${base}music/${track.file}`;
  if (!el.src.endsWith(track.file)) el.src = src;
  void el.play().catch(() => {
    /* needs a gesture; the play button provides one */
  });
}

export function setMuted(m: boolean) {
  if (el) el.muted = m;
}
