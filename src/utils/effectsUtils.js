/**
 * Effects and color grading utilities for video editor
 * Handles brightness, contrast, saturation, hue adjustments
 */

/**
 * Generate CSS filter string from effects object
 */
export const generateFilterString = (effects = {}) => {
  const {
    brightness = 100,
    contrast = 100,
    saturation = 100,
    hue = 0,
    blur = 0,
    opacity = 100,
  } = effects;

  const filters = [];

  if (brightness !== 100) {
    filters.push(`brightness(${brightness}%)`);
  }
  if (contrast !== 100) {
    filters.push(`contrast(${contrast}%)`);
  }
  if (saturation !== 100) {
    filters.push(`saturate(${saturation}%)`);
  }
  if (hue !== 0) {
    filters.push(`hue-rotate(${hue}deg)`);
  }
  if (blur !== 0) {
    filters.push(`blur(${blur}px)`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
};

/**
 * Preset color grades
 */
export const colorGradePresets = {
  original: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
  },
  vintage: {
    brightness: 110,
    contrast: 85,
    saturation: 70,
    hue: 8,
  },
  cool: {
    brightness: 100,
    contrast: 110,
    saturation: 90,
    hue: 200,
  },
  warm: {
    brightness: 105,
    contrast: 95,
    saturation: 110,
    hue: 20,
  },
  blackAndWhite: {
    brightness: 100,
    contrast: 120,
    saturation: 0,
    hue: 0,
  },
  cinematic: {
    brightness: 95,
    contrast: 130,
    saturation: 85,
    hue: 5,
  },
  sepia: {
    brightness: 100,
    contrast: 100,
    saturation: 50,
    hue: 35,
  },
};

/**
 * Apply effect keyframes at a specific time
 */
export const getEffectAtTime = (time, effectKeyframes = {}) => {
  const effects = {};

  for (const [key, keyframes] of Object.entries(effectKeyframes)) {
    if (!Array.isArray(keyframes) || keyframes.length === 0) {
      continue;
    }

    const sorted = [...keyframes].sort((a, b) => a.time - b.time);

    if (time <= sorted[0].time) {
      effects[key] = sorted[0].value;
    } else if (time >= sorted[sorted.length - 1].time) {
      effects[key] = sorted[sorted.length - 1].value;
    } else {
      for (let i = 0; i < sorted.length - 1; i++) {
        const kf1 = sorted[i];
        const kf2 = sorted[i + 1];

        if (time >= kf1.time && time <= kf2.time) {
          const timeDiff = kf2.time - kf1.time;
          const progress = (time - kf1.time) / timeDiff;
          effects[key] = kf1.value + (kf2.value - kf1.value) * progress;
          break;
        }
      }
    }
  }

  return effects;
};

/**
 * Validate effect values
 */
export const validateEffects = (effects) => {
  return {
    brightness: Math.max(0, Math.min(effects.brightness || 100, 200)),
    contrast: Math.max(0, Math.min(effects.contrast || 100, 200)),
    saturation: Math.max(0, Math.min(effects.saturation || 100, 200)),
    hue: ((effects.hue || 0) % 360 + 360) % 360,
    blur: Math.max(0, effects.blur || 0),
    opacity: Math.max(0, Math.min(effects.opacity || 100, 100)),
  };
};

/**
 * Blend two effects (useful for transitions)
 */
export const blendEffects = (effect1, effect2, blendFactor) => {
  const blend = (val1, val2) => val1 + (val2 - val1) * blendFactor;

  return {
    brightness: blend(effect1.brightness || 100, effect2.brightness || 100),
    contrast: blend(effect1.contrast || 100, effect2.contrast || 100),
    saturation: blend(effect1.saturation || 100, effect2.saturation || 100),
    hue: blend(effect1.hue || 0, effect2.hue || 0),
    blur: blend(effect1.blur || 0, effect2.blur || 0),
    opacity: blend(effect1.opacity || 100, effect2.opacity || 100),
  };
};

/**
 * Create color grading keyframes
 */
export const addEffectKeyframe = (effectKeyframes, effectName, time, value) => {
  const keyframes = effectKeyframes[effectName] || [];
  const newKeyframes = [...keyframes];
  const index = newKeyframes.findIndex(kf => kf.time === time);

  if (index >= 0) {
    newKeyframes[index] = { time, value };
  } else {
    newKeyframes.push({ time, value });
  }

  return {
    ...effectKeyframes,
    [effectName]: newKeyframes.sort((a, b) => a.time - b.time),
  };
};

/**
 * Remove effect keyframe
 */
export const removeEffectKeyframe = (effectKeyframes, effectName, time) => {
  return {
    ...effectKeyframes,
    [effectName]: (effectKeyframes[effectName] || []).filter(kf => kf.time !== time),
  };
};
