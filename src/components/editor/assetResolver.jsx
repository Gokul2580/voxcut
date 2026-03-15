/**
 * VOXCUT — Asset Reference Resolver
 *
 * Resolves natural language asset references to actual asset objects
 * before hitting the AI, for fast deterministic matching.
 *
 * Rules:
 *   "first video"        → videos[0]
 *   "second clip"        → allAssets[1]
 *   "third audio"        → audios[2]
 *   "audio file" / "the audio" / "an audio" → audios[0]
 *   "music" / "background music" / "soundtrack" → audio with longest duration
 *   "first image" / "photo" → images[0]
 */

const ORDINALS = {
  first: 0, "1st": 0, one: 0,
  second: 1, "2nd": 1, two: 1,
  third: 2, "3rd": 2, three: 2,
  fourth: 3, "4th": 3, four: 3,
  fifth: 4, "5th": 4, five: 4,
};

function byType(assets, type) {
  return assets.filter(a => a.media_type === type);
}

function longestAudio(assets) {
  const audios = byType(assets, "audio");
  if (!audios.length) return null;
  return audios.reduce((best, a) => (!best || (a.duration || 0) > (best.duration || 0)) ? a : best, null);
}

/**
 * Try to resolve a natural language reference to an asset.
 *
 * @param {string} text
 * @param {Array}  assets  — full media library
 * @returns {object|null}  — matched asset or null if unresolved
 */
export function resolveAssetReference(text, assets) {
  if (!assets || !assets.length) return null;
  const t = text.toLowerCase();

  // ── "background music" / "soundtrack" / "music" → longest audio ──────────
  if (/\b(background\s+music|soundtrack|bgm)\b/.test(t)) {
    return longestAudio(assets);
  }
  if (/\bmusic\b/.test(t) && !/\bmusic\s+video\b/.test(t)) {
    return longestAudio(assets);
  }

  // ── ordinal + type: "first video", "second clip", "3rd audio" ────────────
  const ordinalMatch = t.match(
    /\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|one|two|three|four|five)\b/
  );
  const ordinalIndex = ordinalMatch ? (ORDINALS[ordinalMatch[1]] ?? null) : null;

  const isVideo = /\b(video|clip|footage)\b/.test(t);
  const isAudio = /\b(audio|sound|track)\b/.test(t) && !/\bsoundtrack\b/.test(t);
  const isImage = /\b(image|photo|picture|img)\b/.test(t);

  if (ordinalIndex !== null) {
    if (isVideo)  return byType(assets, "video")[ordinalIndex]  ?? null;
    if (isAudio)  return byType(assets, "audio")[ordinalIndex]  ?? null;
    if (isImage)  return byType(assets, "image")[ordinalIndex]  ?? null;
    // "second clip" / "first file" — ordinal over all assets
    return assets[ordinalIndex] ?? null;
  }

  // ── unqualified type references ───────────────────────────────────────────
  // "the audio file" / "an audio" / "my audio"
  if (/\b(the\s+|an?\s+|my\s+)?audio(\s+file)?\b/.test(t)) {
    return byType(assets, "audio")[0] ?? null;
  }
  // "a video" / "the video" — only if singular reference (no ordinal caught)
  if (/\b(the\s+|an?\s+|my\s+)video(\s+file)?\b/.test(t)) {
    return byType(assets, "video")[0] ?? null;
  }
  // "a photo" / "the image"
  if (/\b(the\s+|an?\s+|my\s+)(image|photo)(\s+file)?\b/.test(t)) {
    return byType(assets, "image")[0] ?? null;
  }

  return null;
}