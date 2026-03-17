/**
 * Audio utilities for video editor
 * Handles volume, fade, and audio effect calculations
 */

/**
 * Calculate volume at a specific time based on fade keyframes
 * @param {number} time - Time in seconds
 * @param {number} baseVolume - Base volume (0-1)
 * @param {Array} fadeKeyframes - Array of {time, volume} keyframes
 */
export const getVolumeAtTime = (time, baseVolume = 1, fadeKeyframes = []) => {
  if (!fadeKeyframes || fadeKeyframes.length === 0) {
    return baseVolume;
  }

  const sorted = [...fadeKeyframes].sort((a, b) => a.time - b.time);

  if (time <= sorted[0].time) {
    return sorted[0].volume * baseVolume;
  }

  if (time >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].volume * baseVolume;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const kf1 = sorted[i];
    const kf2 = sorted[i + 1];

    if (time >= kf1.time && time <= kf2.time) {
      const timeDiff = kf2.time - kf1.time;
      const progress = (time - kf1.time) / timeDiff;
      const interpolatedVolume = kf1.volume + (kf2.volume - kf1.volume) * progress;
      return interpolatedVolume * baseVolume;
    }
  }

  return baseVolume;
};

/**
 * Create fade in effect
 */
export const createFadeIn = (duration, startVolume = 0) => {
  return [
    { time: 0, volume: startVolume },
    { time: duration, volume: 1 },
  ];
};

/**
 * Create fade out effect
 */
export const createFadeOut = (startTime, duration, endVolume = 0) => {
  return [
    { time: startTime, volume: 1 },
    { time: startTime + duration, volume: endVolume },
  ];
};

/**
 * Merge multiple fade keyframes
 */
export const mergeFadeKeyframes = (keyframes1, keyframes2) => {
  const merged = [...keyframes1, ...keyframes2];
  const uniqueKeyframes = {};

  merged.forEach(kf => {
    const key = kf.time.toFixed(3); // Use fixed precision for time comparison
    if (!uniqueKeyframes[key] || uniqueKeyframes[key].volume < kf.volume) {
      uniqueKeyframes[key] = kf;
    }
  });

  return Object.values(uniqueKeyframes).sort((a, b) => a.time - b.time);
};

/**
 * Get audio level for visualization (0-1)
 */
export const getAudioLevel = (time, baseVolume = 1, fadeKeyframes = []) => {
  return getVolumeAtTime(time, baseVolume, fadeKeyframes);
};

/**
 * Apply audio effects
 */
export const applyAudioEffect = (effect, baseVolume = 1) => {
  const effectMap = {
    none: baseVolume,
    boost: Math.min(baseVolume * 1.5, 1),
    quiet: baseVolume * 0.7,
    mute: 0,
  };

  return effectMap[effect] || baseVolume;
};

/**
 * Calculate decibels from linear volume
 */
export const volumeToDb = (volume) => {
  if (volume <= 0) return -Infinity;
  return 20 * Math.log10(volume);
};

/**
 * Calculate linear volume from decibels
 */
export const dbToVolume = (db) => {
  return Math.pow(10, db / 20);
};
