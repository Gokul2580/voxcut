import { ensureTracks, updateTrackByType } from "./timelineHelpers";

export function timelineReducer(state, action) {
  const tl = ensureTracks(state);

  switch (action.type) {

    case "trim_clip": {
      const safeDuration = Number(action.duration);
      if (!isFinite(safeDuration) || safeDuration <= 0 || safeDuration > 86400) return tl;
      if (!action.clipId) return tl;
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId ? { ...c, duration: safeDuration } : c
        ),
      }));
    }

    case "remove_clip": {
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips
          .filter(c => c.id !== action.clipId)
          .map((c, i) => ({ ...c, order: i + 1 })),
      }));
    }

    case "reorder_clips": {
      if (!Array.isArray(action.clipIds) || action.clipIds.length === 0) return tl;
      return updateTrackByType(tl, "video", (track) => {
        const map = Object.fromEntries(track.clips.map(c => [c.id, c]));
        const reordered = action.clipIds
          .map((id, i) => (map[id] ? { ...map[id], order: i + 1 } : null))
          .filter(Boolean);
        const mentioned = new Set(action.clipIds);
        const rest = track.clips.filter(c => !mentioned.has(c.id));
        return {
          clips: [
            ...reordered,
            ...rest.map((c, i) => ({ ...c, order: reordered.length + i + 1 })),
          ],
        };
      });
    }

    case "add_text_overlay": {
      if (!action.content) return tl;
      const newElement = {
        id:       `text_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        content:  action.content,
        duration: action.duration  ?? 5,
        startTime:action.startTime ?? 0,
        x:        action.x        ?? 50,
        y:        action.y        ?? 80,
        fontSize: action.fontSize ?? 24,
        color:    action.color    ?? "#ffffff",
        bold:     action.bold     ?? false,
      };
      return updateTrackByType(tl, "text", (track) => ({
        elements: [...(track.elements || []), newElement],
      }));
    }

    case "remove_text": {
      if (action.index == null || action.index < 0) return tl;
      return updateTrackByType(tl, "text", (track) => ({
        elements: (track.elements || []).filter((_, i) => i !== action.index),
      }));
    }

    case "set_volume": {
      if (action.volume == null) return tl;
      const vol = Math.min(1, Math.max(0, action.volume));
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId ? { ...c, volume: vol } : c
        ),
      }));
    }

    case "set_mute": {
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId ? { ...c, muted: !!action.muted } : c
        ),
      }));
    }

    case "split_clip": {
      if (!action.clipId || action.splitAt == null || action.splitAt <= 0) return tl;
      return updateTrackByType(tl, "video", (track) => {
        const clip = track.clips.find(c => c.id === action.clipId);
        if (!clip || action.splitAt >= clip.duration) return track;
        const firstHalf = { ...clip, duration: action.splitAt };
        const secondHalf = {
          ...clip,
          id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          duration: clip.duration - action.splitAt,
          trimStart: (clip.trimStart || 0) + action.splitAt,
          order: clip.order + 0.5,
        };
        return {
          clips: track.clips
            .map(c => (c.id === action.clipId ? firstHalf : c))
            .concat(secondHalf)
            .sort((a, b) => a.order - b.order)
            .map((c, i) => ({ ...c, order: i + 1 })),
        };
      });
    }

    case "duplicate_clip": {
      if (!action.clipId) return tl;
      return updateTrackByType(tl, "video", (track) => {
        const clip = track.clips.find(c => c.id === action.clipId);
        if (!clip) return track;
        const duplicate = {
          ...clip,
          id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          order: clip.order + 0.5,
        };
        return {
          clips: [...track.clips, duplicate]
            .sort((a, b) => a.order - b.order)
            .map((c, i) => ({ ...c, order: i + 1 })),
        };
      });
    }

    case "change_playback_speed": {
      if (!action.clipId || action.speed == null) return tl;
      const speed = Math.max(0.25, Math.min(4, action.speed));
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId ? { ...c, speed } : c
        ),
      }));
    }

    case "add_transition": {
      if (!action.clipId) return tl;
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c => {
          if (c.id !== action.clipId) return c;
          if (!action.transitionType || action.transitionType === "none") {
            const { transition, ...rest } = c;
            return rest;
          }
          return { ...c, transition: { type: action.transitionType, duration: action.transitionDuration || 0.5 } };
        }),
      }));
    }

    case "add_audio_clip": {
      if (!action.clip) return tl;
      const newAudioClip = {
        id: action.clip.id || `audio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        src: action.clip.src,
        name: action.clip.name,
        duration: action.clip.duration || 0,
        volume: action.clip.volume ?? 1,
        muted: action.clip.muted ?? false,
        order: action.clip.order ?? 1,
        mediaType: "audio",
      };
      return updateTrackByType(tl, "audio", (track) => ({
        clips: [...(track.clips || []), newAudioClip].map((c, i) => ({ ...c, order: i + 1 })),
      }));
    }

    case "remove_audio_clip": {
      return updateTrackByType(tl, "audio", (track) => ({
        clips: (track.clips || [])
          .filter(c => c.id !== action.clipId)
          .map((c, i) => ({ ...c, order: i + 1 })),
      }));
    }

    case "set_audio_volume": {
      if (action.volume == null) return tl;
      const vol = Math.min(1, Math.max(0, action.volume));
      return updateTrackByType(tl, "audio", (track) => ({
        clips: (track.clips || []).map(c =>
          c.id === action.clipId ? { ...c, volume: vol } : c
        ),
      }));
    }

    case "add_image_overlay": {
      if (!action.clip) return tl;
      const newOverlay = {
        id: action.clip.id || `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        src: action.clip.src,
        name: action.clip.name,
        duration: action.clip.duration ?? 5,
        startTime: action.clip.startTime ?? 0,
        x: action.clip.x ?? 50,
        y: action.clip.y ?? 50,
        width: action.clip.width ?? 30,
        order: (action.clip.order ?? 1),
        mediaType: "image",
      };
      return updateTrackByType(tl, "image_overlay", (track) => ({
        clips: [...(track.clips || []), newOverlay].map((c, i) => ({ ...c, order: i + 1 })),
      }));
    }

    case "remove_image_overlay": {
      return updateTrackByType(tl, "image_overlay", (track) => ({
        clips: (track.clips || [])
          .filter(c => c.id !== action.clipId)
          .map((c, i) => ({ ...c, order: i + 1 })),
      }));
    }

    case "set_audio_mute": {
      return updateTrackByType(tl, "audio", (track) => ({
        clips: (track.clips || []).map(c =>
          c.id === action.clipId ? { ...c, muted: !!action.muted } : c
        ),
      }));
    }

    case "TRIM_CLIP": {
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId
            ? { 
                ...c, 
                trimStart: action.trimStart !== undefined ? action.trimStart : (c.trimStart || 0),
                trimEnd: action.trimEnd !== undefined ? action.trimEnd : (c.trimEnd || 0)
              }
            : c
        ),
      }));
    }

    case "REMOVE_CLIP": {
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips
          .filter(c => c.id !== action.clipId)
          .map((c, i) => ({ ...c, order: i + 1 })),
      }));
    }

    case "DUPLICATE_CLIP": {
      return updateTrackByType(tl, "video", (track) => {
        const clip = track.clips.find(c => c.id === action.clipId);
        if (!clip) return track;
        const duplicate = {
          ...clip,
          id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          order: clip.order + 0.5,
        };
        return {
          clips: [...track.clips, duplicate]
            .sort((a, b) => a.order - b.order)
            .map((c, i) => ({ ...c, order: i + 1 })),
        };
      });
    }

    case "TOGGLE_MUTE": {
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId ? { ...c, muted: action.muted } : c
        ),
      }));
    }

    case "SET_SPEED": {
      const speed = Math.max(0.25, Math.min(4, action.speed));
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId ? { ...c, speed } : c
        ),
      }));
    }

    case "ADD_EFFECT": {
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId
            ? { ...c, effects: [...(c.effects || []), action.effect] }
            : c
        ),
      }));
    }

    case "CROP_CLIP": {
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId ? { ...c, crop: action.crop } : c
        ),
      }));
    }

    case "SPLIT_CLIP": {
      return updateTrackByType(tl, "video", (track) => {
        const clip = track.clips.find(c => c.id === action.clipId);
        if (!clip) return track;
        const splitTime = action.splitTime || (clip.duration / 2);
        const firstHalf = { ...clip, duration: splitTime };
        const secondHalf = {
          ...clip,
          id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          duration: clip.duration - splitTime,
          trimStart: (clip.trimStart || 0) + splitTime,
          order: clip.order + 0.5,
        };
        return {
          clips: track.clips
            .map(c => (c.id === action.clipId ? firstHalf : c))
            .concat(secondHalf)
            .sort((a, b) => a.order - b.order)
            .map((c, i) => ({ ...c, order: i + 1 })),
        };
      });
    }

    case "SET_TRANSITION": {
      return updateTrackByType(tl, "video", (track) => ({
        clips: track.clips.map(c =>
          c.id === action.clipId ? { ...c, transition: action.transition } : c
        ),
      }));
    }

    case "ADD_CAPTIONS": {
      return updateTrackByType(tl, "text", (track) => ({
        elements: [...(track.elements || []), ...(action.captions || [])],
      }));
    }

    case "__set__":
      return ensureTracks(action.__payload);

    default:
      // Unknown action — return state unchanged, never crash
      console.warn("[timelineReducer] Unknown action type:", action.type);
      return tl;
  }
}