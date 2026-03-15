export const DEFAULT_TRACKS = [
  { id: "video_track_1",   type: "video",         clips: [] },
  { id: "audio_track_1",   type: "audio",         clips: [] },
  { id: "image_overlay_1", type: "image_overlay", clips: [] },
  { id: "text_track",      type: "text",          elements: [] },
];

export const DEFAULT_SETTINGS = { aspectRatio: "16:9", resolution: "1920x1080", fps: 30 };

const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "avi", "mkv"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg", "aac", "flac"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "avif"];

/**
 * Derive mediaType from a MIME type string or file name/extension.
 * Checks MIME type first, then falls back to file extension.
 */
export function inferMediaType(mimeTypeOrFileName) {
  if (!mimeTypeOrFileName) return "video";
  const val = mimeTypeOrFileName.toLowerCase();

  // MIME type check
  if (val.startsWith("audio/")) return "audio";
  if (val.startsWith("image/")) return "image";
  if (val.startsWith("video/")) return "video";

  // Extension check (handles filenames like "clip.mp4" or bare "mp3")
  const ext = val.split(".").pop();
  if (AUDIO_EXTENSIONS.includes(ext)) return "audio";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";

  return "video";
}

/**
 * Validate that an asset can be placed on a given track type.
 * Returns { valid: boolean, reason?: string }
 */
export function validateAssetForTrack(asset, trackType) {
  const mt = asset.media_type || inferMediaType(asset.file_type) || "video";
  if (trackType === "video" && mt === "audio") {
    return { valid: false, reason: "Audio files cannot be placed on a video track. Add them to the audio track." };
  }
  if (trackType === "audio" && mt === "video") {
    return { valid: false, reason: "Video files cannot be placed on an audio-only track." };
  }
  if (trackType === "audio" && mt === "image") {
    return { valid: false, reason: "Image files cannot be placed on an audio track." };
  }
  return { valid: true };
}

/** Migrate legacy { clips, texts } format to new multi-track format. */
export function ensureTracks(tl) {
  if (!tl) return { tracks: DEFAULT_TRACKS.map(t => ({ ...t })), settings: { ...DEFAULT_SETTINGS } };
  if (Array.isArray(tl.tracks)) {
    // Backfill image_overlay track if missing (legacy timelines)
    const hasImageTrack = tl.tracks.some(t => t.type === "image_overlay");
    if (!hasImageTrack) {
      return { ...tl, tracks: [...tl.tracks, { id: "image_overlay_1", type: "image_overlay", clips: [] }] };
    }
    return tl;
  }
  return {
    tracks: [
      { id: "video_track_1",   type: "video",         clips: tl.clips || [] },
      { id: "audio_track_1",   type: "audio",         clips: [] },
      { id: "image_overlay_1", type: "image_overlay", clips: [] },
      { id: "text_track",      type: "text",          elements: tl.texts || [] },
    ],
    settings: tl.settings || { ...DEFAULT_SETTINGS },
  };
}

export function getVideoTrack(tl) {
  return tl?.tracks?.find(t => t.type === "video") || { type: "video", clips: [] };
}

export function getAudioTrack(tl) {
  return tl?.tracks?.find(t => t.type === "audio") || { type: "audio", clips: [] };
}

export function getTextTrack(tl) {
  return tl?.tracks?.find(t => t.type === "text") || { type: "text", elements: [] };
}

export function getImageOverlayTrack(tl) {
  return tl?.tracks?.find(t => t.type === "image_overlay") || { type: "image_overlay", clips: [] };
}

/** Sorted video clips */
export function getClips(tl) {
  return [...(getVideoTrack(tl).clips || [])].sort((a, b) => a.order - b.order);
}

/** Sorted audio clips */
export function getAudioClips(tl) {
  return [...(getAudioTrack(tl).clips || [])].sort((a, b) => a.order - b.order);
}

/** Text elements from the text track */
export function getTexts(tl) {
  return getTextTrack(tl).elements || [];
}

/** Immutably update a specific track by type */
export function updateTrackByType(tl, trackType, updater) {
  return {
    ...tl,
    tracks: (tl.tracks || []).map(track =>
      track.type === trackType ? { ...track, ...updater(track) } : track
    ),
  };
}