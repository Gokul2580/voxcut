/**
 * Crop and pan utilities for video editor
 * Handles crop calculations and pan/zoom effects
 */

/**
 * Apply crop to video dimensions
 * @param {number} x - Left crop amount (0-1, relative to width)
 * @param {number} y - Top crop amount (0-1, relative to height)
 * @param {number} width - Crop width (0-1, relative to width)
 * @param {number} height - Crop height (0-1, relative to height)
 * @param {number} videoWidth - Original video width
 * @param {number} videoHeight - Original video height
 */
export const calculateCropDimensions = (
  { x, y, width, height },
  videoWidth,
  videoHeight
) => {
  const pixelX = x * videoWidth;
  const pixelY = y * videoHeight;
  const pixelWidth = width * videoWidth;
  const pixelHeight = height * videoHeight;

  return {
    clipPath: `inset(${pixelY}px ${videoWidth - pixelX - pixelWidth}px ${videoHeight - pixelY - pixelHeight}px ${pixelX}px)`,
    transform: `translate(-${pixelX}px, -${pixelY}px)`,
    width: pixelWidth,
    height: pixelHeight,
  };
};

/**
 * Validate crop boundaries
 */
export const validateCrop = (crop) => {
  return {
    x: Math.max(0, Math.min(crop.x, 1)),
    y: Math.max(0, Math.min(crop.y, 1)),
    width: Math.max(0, Math.min(crop.width, 1 - crop.x)),
    height: Math.max(0, Math.min(crop.height, 1 - crop.y)),
  };
};

/**
 * Create a pan animation between two crop positions
 * @param {Object} startCrop - Starting crop coordinates
 * @param {Object} endCrop - Ending crop coordinates
 * @param {number} duration - Duration in seconds
 * @returns {Object} Keyframes for animation
 */
export const createPanAnimation = (startCrop, endCrop, duration) => {
  return {
    x: [
      { time: 0, value: startCrop.x },
      { time: duration, value: endCrop.x },
    ],
    y: [
      { time: 0, value: startCrop.y },
      { time: duration, value: endCrop.y },
    ],
    width: [
      { time: 0, value: startCrop.width },
      { time: duration, value: endCrop.width },
    ],
    height: [
      { time: 0, value: startCrop.height },
      { time: duration, value: endCrop.height },
    ],
  };
};

/**
 * Calculate zoom effect
 * Zoom from one point to another
 */
export const calculateZoom = (zoomLevel, centerX = 0.5, centerY = 0.5) => {
  const scale = zoomLevel;
  const cropWidth = 1 / scale;
  const cropHeight = 1 / scale;
  
  // Center the crop around the specified point
  const x = Math.max(0, Math.min(centerX - cropWidth / 2, 1 - cropWidth));
  const y = Math.max(0, Math.min(centerY - cropHeight / 2, 1 - cropHeight));

  return {
    x,
    y,
    width: cropWidth,
    height: cropHeight,
  };
};

/**
 * Get crop preview overlay points for UI
 */
export const getCropPreviewPoints = (crop, containerWidth, containerHeight) => {
  return {
    top: crop.y * containerHeight,
    left: crop.x * containerWidth,
    width: crop.width * containerWidth,
    height: crop.height * containerHeight,
  };
};
