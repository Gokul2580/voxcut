/**
 * Keyframe animation utilities for video editor
 * Handles interpolation between keyframes for smooth animations
 */

/**
 * Interpolate between two values based on easing function
 */
export const interpolate = (start, end, progress, easing = 'linear') => {
  let t = progress;
  
  switch (easing) {
    case 'easeInQuad':
      t = progress * progress;
      break;
    case 'easeOutQuad':
      t = 1 - (1 - progress) * (1 - progress);
      break;
    case 'easeInOutQuad':
      t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      break;
    case 'easeInCubic':
      t = progress * progress * progress;
      break;
    case 'easeOutCubic':
      t = 1 - Math.pow(1 - progress, 3);
      break;
    case 'easeInOutCubic':
      t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      break;
    default:
      t = progress;
  }
  
  return start + (end - start) * t;
};

/**
 * Get interpolated value at a specific time based on keyframes
 */
export const getValueAtTime = (time, keyframes, easing = 'linear') => {
  if (!keyframes || keyframes.length === 0) return null;
  
  // Sort keyframes by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  
  // If time is before first keyframe
  if (time < sorted[0].time) {
    return sorted[0].value;
  }
  
  // If time is after last keyframe
  if (time > sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].value;
  }
  
  // Find the two keyframes to interpolate between
  for (let i = 0; i < sorted.length - 1; i++) {
    const kf1 = sorted[i];
    const kf2 = sorted[i + 1];
    
    if (time >= kf1.time && time <= kf2.time) {
      const timeDiff = kf2.time - kf1.time;
      const progress = (time - kf1.time) / timeDiff;
      
      return interpolate(kf1.value, kf2.value, progress, easing);
    }
  }
  
  return sorted[sorted.length - 1].value;
};

/**
 * Get interpolated transform at a specific time (for position, scale, rotation, opacity)
 */
export const getTransformAtTime = (time, keyframes) => {
  const transform = {
    x: getValueAtTime(time, keyframes.x || [], 'easeInOutQuad') || 0,
    y: getValueAtTime(time, keyframes.y || [], 'easeInOutQuad') || 0,
    scaleX: getValueAtTime(time, keyframes.scaleX || [], 'easeInOutQuad') || 1,
    scaleY: getValueAtTime(time, keyframes.scaleY || [], 'easeInOutQuad') || 1,
    rotation: getValueAtTime(time, keyframes.rotation || [], 'easeInOutQuad') || 0,
    opacity: getValueAtTime(time, keyframes.opacity || [], 'easeInOutQuad') ?? 1,
  };
  
  return transform;
};

/**
 * Add or update a keyframe
 */
export const addKeyframe = (keyframes, time, value) => {
  const newKeyframes = [...keyframes];
  const index = newKeyframes.findIndex(kf => kf.time === time);
  
  if (index >= 0) {
    newKeyframes[index] = { ...newKeyframes[index], value };
  } else {
    newKeyframes.push({ time, value });
  }
  
  return newKeyframes.sort((a, b) => a.time - b.time);
};

/**
 * Remove a keyframe by time
 */
export const removeKeyframe = (keyframes, time) => {
  return keyframes.filter(kf => kf.time !== time);
};

/**
 * Check if a keyframe exists at a specific time
 */
export const hasKeyframeAt = (keyframes, time, tolerance = 0.01) => {
  return keyframes.some(kf => Math.abs(kf.time - time) < tolerance);
};
