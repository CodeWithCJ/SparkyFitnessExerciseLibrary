// Pure helpers for the optional YouTube link in exercise.json (media.youtube_url). Shared by
// validate.mjs, the build and the browser: no Node APIs.
//
// The link is one address that carries everything: https://youtu.be/<id>?t=62&end=121 plays 1:02 to
// 2:01 of a longer video. t (or start) is where the exercise starts and end is where it stops, in
// seconds; a plain browser only honours the start, the apps and the site honour both.

export const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/** "62", "1:02", "1:02:03", "1m2s" and "1h2m3s" as seconds. Returns null when it is not a time. */
export function parseTime(text) {
  const s = String(text ?? '').trim().toLowerCase();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  const colon = s.match(/^(?:(\d+):)?(\d+):(\d{1,2}(?:\.\d+)?)$/);
  if (colon) return Number(colon[1] || 0) * 3600 + Number(colon[2]) * 60 + Number(colon[3]);
  const units = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/);
  if (units && (units[1] || units[2] || units[3])) return Number(units[1] || 0) * 3600 + Number(units[2] || 0) * 60 + Number(units[3] || 0);
  return null;
}

/** Seconds as m:ss (or h:mm:ss), for showing a time to people. */
export function formatTime(seconds) {
  const total = Math.round(Number(seconds) || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/**
 * Reads a pasted YouTube address (watch, youtu.be, embed, shorts) into { id, start?, end? }. start and
 * end are only set when the address carries them (t= or start=, and end=). Returns null when it is not a YouTube video.
 */
export function parseYouTube(input) {
  const text = String(input ?? '').trim();
  if (YOUTUBE_ID_PATTERN.test(text)) return { id: text };
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/);
      if (m) id = m[1];
    }
  }
  if (!id || !YOUTUBE_ID_PATTERN.test(id)) return null;
  const start = parseTime(url.searchParams.get('t') ?? url.searchParams.get('start'));
  const end = parseTime(url.searchParams.get('end'));
  return { id, ...(start != null ? { start } : {}), ...(end != null ? { end } : {}) };
}

/** The one address stored in exercise.json for a video id with an optional start and end. */
export function buildYouTubeUrl({ id, start, end }) {
  const p = [];
  if (start != null) p.push(`t=${Math.floor(start)}`);
  if (end != null) p.push(`end=${Math.ceil(end)}`);
  return `https://youtu.be/${id}${p.length ? `?${p.join('&')}` : ''}`;
}

/** Problems with the stored link. Empty when it is fine. */
export function validateYouTubeUrl(link) {
  const parsed = parseYouTube(link);
  if (!parsed) return [`media.youtube_url must be a YouTube video address. Got: ${JSON.stringify(link)}`];
  if (parsed.end != null && parsed.end <= (parsed.start ?? 0)) {
    return [`media.youtube_url: end (${parsed.end}) must be later than the start (${parsed.start ?? 0})`];
  }
  return [];
}

/** The embedded player address. youtube-nocookie.com sets no cookies until someone presses play. */
export function youtubeEmbedUrl({ id, start, end }) {
  const p = new URLSearchParams({ rel: '0', playsinline: '1', modestbranding: '1' });
  if (start != null) p.set('start', String(Math.floor(start)));
  if (end != null) p.set('end', String(Math.ceil(end)));
  return `https://www.youtube-nocookie.com/embed/${id}?${p}`;
}

/** The normal watch address. A watch address can only set a start time, not an end time. */
export function youtubeWatchUrl({ id, start }) {
  return `https://youtu.be/${id}${start ? `?t=${Math.floor(start)}` : ''}`;
}
