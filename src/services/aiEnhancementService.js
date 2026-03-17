import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Initialize Gemini model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Analyze video for enhancement opportunities
 */
export async function analyzeVideoForEnhancement(videoData) {
  try {
    const prompt = `Analyze this video metadata and suggest cinematic enhancements:
    - Duration: ${videoData.duration}s
    - Has motion: ${videoData.hasMotion}
    - Lighting: ${videoData.lightingAnalysis}
    - Colors: ${videoData.colorAnalysis}
    
    Suggest specific enhancements including:
    1. Color grading (brightness, contrast, saturation adjustments)
    2. Blur/defocus areas for depth of field
    3. Text overlays or captions
    4. Transitions between scenes
    5. Music/audio recommendations
    
    Format response as JSON with specific numeric values for effects.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      return JSON.parse(responseText);
    } catch {
      return parseEnhancementResponse(responseText);
    }
  } catch (error) {
    console.error("Error analyzing video:", error);
    return getDefaultEnhancements();
  }
}

/**
 * One-shot cinematic enhancement - automatically improve video quality
 */
export async function applyCinematicEnhancement(clip) {
  try {
    const enhancements = {
      effects: {
        brightness: 105,
        contrast: 115,
        saturation: 110,
        hue: 0,
        blur: 2,
        vignette: 8,
      },
      keyframes: {
        position: [],
        scale: [],
        rotation: [],
        opacity: [],
      },
      audioFade: [
        { time: 0, type: "in", duration: 0.5 },
        { time: clip.duration - 0.5, type: "out", duration: 0.5 },
      ],
      texts: [],
    };

    // Add automatic blur to non-subject areas for cinematic depth
    if (clip.hasMotion) {
      enhancements.keyframes.scale = [
        { time: 0, value: 1 },
        { time: clip.duration * 0.5, value: 1.05 },
        { time: clip.duration, value: 1 },
      ];
    }

    // Add subtle vignette for cinematic look
    enhancements.effects.vignette = 12;

    // Get AI suggestions for additional enhancements
    try {
      const aiSuggestions = await analyzeVideoForEnhancement({
        duration: clip.duration,
        hasMotion: clip.hasMotion || false,
        lightingAnalysis: "standard",
        colorAnalysis: "standard",
      });

      if (aiSuggestions.effects) {
        enhancements.effects = {
          ...enhancements.effects,
          ...aiSuggestions.effects,
        };
      }
    } catch {
      // Fallback to default enhancements if AI fails
    }

    return enhancements;
  } catch (error) {
    console.error("Error applying cinematic enhancement:", error);
    return getDefaultEnhancements();
  }
}

/**
 * Generate smart captions using AI
 */
export async function generateSmartCaptions(videoData) {
  try {
    if (!videoData.transcript) {
      return [];
    }

    const prompt = `Create cinematic captions from this transcript, breaking into short impactful lines:
    "${videoData.transcript}"
    
    Format as JSON array with objects containing: { text, startTime, duration, style }
    Keep captions punchy and engaging for social media.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse(responseText);
      return Array.isArray(parsed) ? parsed : parsed.captions || [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error("Error generating captions:", error);
    return [];
  }
}

/**
 * Detect and suggest blur zones for privacy/focus
 */
export async function detectBlurZones(videoFrame) {
  try {
    const prompt = `Analyze this video frame for blur opportunities:
    Suggest areas that should be blurred for:
    1. Privacy (faces, license plates, text)
    2. Cinematic focus (background blur for depth)
    
    Format as JSON: { areas: [{ x, y, width, height, blurStrength, reason }] }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: videoFrame,
        },
      },
    ]);

    const responseText = result.response.text();
    try {
      const parsed = JSON.parse(responseText);
      return parsed.areas || [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error("Error detecting blur zones:", error);
    return [];
  }
}

/**
 * Generate color grade recommendations
 */
export function getColorGradeForMood(mood = "cinematic") {
  const grades = {
    cinematic: {
      brightness: 105,
      contrast: 120,
      saturation: 100,
      hue: -5,
      lift: 10,
      gamma: 1.1,
    },
    vibrant: {
      brightness: 110,
      contrast: 110,
      saturation: 130,
      hue: 0,
      lift: 5,
      gamma: 0.95,
    },
    moody: {
      brightness: 95,
      contrast: 130,
      saturation: 80,
      hue: -10,
      lift: 20,
      gamma: 1.2,
    },
    dramatic: {
      brightness: 100,
      contrast: 150,
      saturation: 90,
      hue: 0,
      lift: 5,
      gamma: 1.3,
    },
  };

  return grades[mood] || grades.cinematic;
}

/**
 * Get default enhancements fallback
 */
function getDefaultEnhancements() {
  return {
    effects: {
      brightness: 105,
      contrast: 110,
      saturation: 110,
      hue: 0,
      blur: 1,
      vignette: 5,
    },
    audioFade: [
      { time: 0, type: "in", duration: 0.5 },
    ],
    keyframes: {},
    texts: [],
  };
}

/**
 * Parse text response if JSON parsing fails
 */
function parseEnhancementResponse(text) {
  const enhancements = getDefaultEnhancements();

  if (text.includes("brightness")) {
    const match = text.match(/brightness[:\s]+(\d+)/i);
    if (match) enhancements.effects.brightness = parseInt(match[1]);
  }
  if (text.includes("contrast")) {
    const match = text.match(/contrast[:\s]+(\d+)/i);
    if (match) enhancements.effects.contrast = parseInt(match[1]);
  }
  if (text.includes("saturation")) {
    const match = text.match(/saturation[:\s]+(\d+)/i);
    if (match) enhancements.effects.saturation = parseInt(match[1]);
  }

  return enhancements;
}
