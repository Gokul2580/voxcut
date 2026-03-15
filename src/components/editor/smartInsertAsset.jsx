import { ensureTracks, inferMediaType, getVideoTrack, getAudioTrack } from "./timelineHelpers";

/**
 * Returns total video duration (sum of all video clip durations).
 */
function getVideoDuration(tl) {
  return (getVideoTrack(tl).clips || []).reduce((acc, c) => acc + (c.duration || 0), 0);
}

/**
 * Returns the next available start time on a track's clips (end of last clip).
 */
function getTrackEndTime(clips) {
  if (!clips || clips.length === 0) return 0;
  return clips.reduce((max, c) => Math.max(max, (c.startTime ?? 0) + (c.duration || 0)), 0);
}

/**
 * Find a non-overlapping start time on the audio track at or after `preferredStart`.
 * Scans forward until a free slot of `duration` seconds is available.
 */
function findFreeAudioSlot(audioClips, preferredStart, duration) {
  const sorted = [...(audioClips || [])].sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
  let candidate = preferredStart;

  for (const clip of sorted) {
    const clipStart = clip.startTime ?? 0;
    const clipEnd = clipStart + (clip.duration || 0);
    // If our candidate range overlaps this clip, push candidate past it
    if (candidate < clipEnd && candidate + duration > clipStart) {
      candidate = clipEnd;
    }
  }
  return candidate;
}

/**
 * smartInsertAsset(asset, timeline, playheadTime?)
 *
 * Routes the asset to the correct track intelligently with validation:
 *   - video  → appended to end of video track
 *   - image  → added to image_overlay track
 *   - audio (background music / long) → spans full video duration, starts at 0
 *   - audio (short sfx / clip)        → inserted at playhead with overlap avoidance
 *
 * Returns { success: boolean, timeline?: updatedTimeline, error?: errorMessage }
 */
export function smartInsertAsset(asset, timeline, playheadTime = 0) {
  // ── VALIDATION ──────────────────────────────────────────────────────────────
  
  // Check asset exists
  if (!asset || typeof asset !== "object") {
    return { success: false, error: "Asset not found. Please select a valid media file." };
  }
  
  if (!asset.file_url) {
    return { success: false, error: "Asset file URL is missing." };
  }
  
  // Check duration is valid
  if (asset.duration && (asset.duration <= 0 || !Number.isFinite(asset.duration))) {
    return { success: false, error: "Asset duration is invalid." };
  }
  
  const tl = ensureTracks(timeline);
  const mediaType = asset.media_type
    || (inferMediaType(asset.file_type) !== "video" ? inferMediaType(asset.file_type) : inferMediaType(asset.name))
    || "video";
  
  // Check media type is supported
  if (!["video", "audio", "image"].includes(mediaType)) {
    return { success: false, error: `Unsupported media type: ${mediaType}. Only video, audio, and image files are supported.` };
  }

  // ── VIDEO ──────────────────────────────────────────────────────────────────
  if (mediaType === "video") {
    const videoTrack = tl.tracks.find(t => t.type === "video");
    if (!videoTrack) {
      return { success: false, error: "Video track not found in timeline." };
    }
    
    const clips = videoTrack?.clips || [];
    const newClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      src: asset.file_url,
      name: asset.name,
      start: 0,
      duration: asset.duration || 10,
      order: clips.length + 1,
      mediaType: "video",
    };
    return {
      success: true,
      timeline: {
        ...tl,
        tracks: tl.tracks.map(t =>
          t.type === "video" ? { ...t, clips: [...clips, newClip] } : t
        ),
      },
    };
  }

  // ── IMAGE OVERLAY ──────────────────────────────────────────────────────────
  if (mediaType === "image") {
    const overlayTrack = tl.tracks.find(t => t.type === "image_overlay");
    if (!overlayTrack) {
      return { success: false, error: "Image overlay track not found in timeline." };
    }
    
    const clips = overlayTrack?.clips || [];
    const newOverlay = {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      src: asset.file_url,
      name: asset.name,
      duration: 5,
      startTime: playheadTime,
      x: 50, y: 50, width: 30,
      order: clips.length + 1,
      mediaType: "image",
    };
    return {
      success: true,
      timeline: {
        ...tl,
        tracks: tl.tracks.map(t =>
          t.type === "image_overlay" ? { ...t, clips: [...clips, newOverlay] } : t
        ),
      },
    };
  }

  // ── AUDIO ──────────────────────────────────────────────────────────────────
  if (mediaType === "audio") {
    const audioTrack = tl.tracks.find(t => t.type === "audio");
    const audioClips = audioTrack?.clips || [];
    const videoDuration = getVideoDuration(tl);
    const assetDuration = asset.duration || 0;

    // If no audio exists, treat first audio as background music
    const isFirstAudio = audioClips.length === 0;
    const isBackgroundMusic = isFirstAudio || (
      videoDuration > 0 && assetDuration > 0 && assetDuration >= videoDuration * 0.75
    );

    let startTime;
    let duration;

    if (isBackgroundMusic) {
      // Span the full video, start at 0, no overlap check needed (replaces background role)
      startTime = 0;
      duration = videoDuration || assetDuration;
    } else {
      // Short clip / SFX — align with playhead, avoid overlaps
      const slotDuration = assetDuration || 5;
      startTime = findFreeAudioSlot(audioClips, playheadTime, slotDuration);
      duration = assetDuration || 5;
    }

    const newAudioClip = {
      id: `audio_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      src: asset.file_url,
      name: asset.name,
      duration,
      startTime,
      volume: isBackgroundMusic ? 0.3 : 1,
      muted: false,
      order: audioClips.length + 1,
      mediaType: "audio",
      isBackgroundMusic,
    };

    return {
      success: true,
      timeline: {
        ...tl,
        tracks: tl.tracks.map(t =>
          t.type === "audio"
            ? { ...t, clips: [...audioClips, newAudioClip].map((c, i) => ({ ...c, order: i + 1 })) }
            : t
        ),
      },
    };
  }

  // Unknown type — should not reach here due to earlier check
  return { success: false, error: "Unable to insert asset. Please try again." };
}