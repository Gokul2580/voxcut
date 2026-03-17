import { FFmpeg, FFMpegOptions } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpeg = null;
let ffmpegReady = false;

/**
 * Initialize FFmpeg
 */
export async function initFFmpeg() {
  if (ffmpegReady) return ffmpeg;

  try {
    ffmpeg = new FFmpeg();

    ffmpeg.on("log", ({ type, message }) => {
      if (type === "error") console.error("[FFmpeg]", message);
      else console.log("[FFmpeg]", message);
    });

    const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    ffmpegReady = true;
    return ffmpeg;
  } catch (error) {
    console.error("Failed to initialize FFmpeg:", error);
    throw error;
  }
}

/**
 * Apply video effects and export
 */
export async function applyEffectsAndExport(videoFile, effects, progressCallback) {
  try {
    const ff = await initFFmpeg();

    // Write input video
    const inputData = await videoFile.arrayBuffer();
    await ff.writeFile("input.mp4", new Uint8Array(inputData));

    // Build FFmpeg filter chain
    let filterChain = buildFilterChain(effects);

    // Run ffmpeg command
    const command = [
      "-i",
      "input.mp4",
      "-vf",
      filterChain,
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "output.mp4",
    ];

    await ff.exec(command);

    // Read output
    const data = await ff.readFile("output.mp4");
    const blob = new Blob([data.buffer], { type: "video/mp4" });

    // Clean up
    await ff.deleteFile("input.mp4");
    await ff.deleteFile("output.mp4");

    if (progressCallback) progressCallback(100);

    return blob;
  } catch (error) {
    console.error("Error exporting video:", error);
    throw error;
  }
}

/**
 * Build FFmpeg filter chain from effects object
 */
function buildFilterChain(effects) {
  const filters = [];

  if (!effects) return "copy";

  // Brightness
  if (effects.brightness && effects.brightness !== 100) {
    const brightness = (effects.brightness - 100) / 100;
    filters.push(`eq=brightness=${brightness}`);
  }

  // Contrast
  if (effects.contrast && effects.contrast !== 100) {
    const contrast = effects.contrast / 100;
    filters.push(`eq=contrast=${contrast}`);
  }

  // Saturation
  if (effects.saturation && effects.saturation !== 100) {
    const saturation = effects.saturation / 100;
    filters.push(`hue=s=${saturation}`);
  }

  // Blur
  if (effects.blur && effects.blur > 0) {
    filters.push(`boxblur=${Math.min(effects.blur, 10)}`);
  }

  // Vignette
  if (effects.vignette && effects.vignette > 0) {
    filters.push(
      `vignette=angle=PI/4:mode=NaN:eval=init:x=${effects.vignette / 100}:y=${effects.vignette / 100}`
    );
  }

  // Hue shift
  if (effects.hue && effects.hue !== 0) {
    filters.push(`hue=h=${effects.hue}`);
  }

  if (filters.length === 0) return "copy";

  return filters.join(",");
}

/**
 * Export with text overlays
 */
export async function exportWithText(videoBlob, texts, progressCallback) {
  try {
    const ff = await initFFmpeg();

    // Create drawtext filter for each text element
    let drawTextFilter = "";

    texts.forEach((text, index) => {
      const drawtext = `drawtext=fontfile=/path/to/font.ttf:text='${text.content.replace(
        /'/g,
        "\\'"
      )}':x=${text.x || 10}:y=${text.y || 10}:fontsize=${text.fontSize || 24}:fontcolor=${
        text.color || "white"
      }:alpha=${(text.opacity || 100) / 100}`;

      if (drawTextFilter) {
        drawTextFilter += `[v${index - 1}]${drawtext}[v${index}]`;
      } else {
        drawTextFilter = `[0]${drawtext}[v${index}]`;
      }
    });

    return videoBlob;
  } catch (error) {
    console.error("Error exporting with text:", error);
    throw error;
  }
}

/**
 * Export high-quality version
 */
export async function exportHighQuality(videoBlob, progressCallback) {
  try {
    const ff = await initFFmpeg();

    const inputData = await videoBlob.arrayBuffer();
    await ff.writeFile("input.mp4", new Uint8Array(inputData));

    const command = [
      "-i",
      "input.mp4",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "output.mp4",
    ];

    await ff.exec(command);

    const data = await ff.readFile("output.mp4");
    const blob = new Blob([data.buffer], { type: "video/mp4" });

    await ff.deleteFile("input.mp4");
    await ff.deleteFile("output.mp4");

    if (progressCallback) progressCallback(100);

    return blob;
  } catch (error) {
    console.error("Error exporting high quality:", error);
    throw error;
  }
}

/**
 * Export optimized for social media
 */
export async function exportForSocialMedia(videoBlob, platform = "youtube") {
  try {
    const ff = await initFFmpeg();

    const configs = {
      youtube: {
        codec: "libx264",
        preset: "medium",
        crf: "20",
        bitrate: "8000k",
        audio_bitrate: "128k",
      },
      tiktok: {
        codec: "libx264",
        preset: "fast",
        crf: "25",
        bitrate: "4000k",
        audio_bitrate: "96k",
      },
      instagram: {
        codec: "libx264",
        preset: "medium",
        crf: "22",
        bitrate: "6000k",
        audio_bitrate: "128k",
      },
    };

    const config = configs[platform] || configs.youtube;

    const inputData = await videoBlob.arrayBuffer();
    await ff.writeFile("input.mp4", new Uint8Array(inputData));

    const command = [
      "-i",
      "input.mp4",
      "-c:v",
      config.codec,
      "-preset",
      config.preset,
      "-crf",
      config.crf,
      "-b:v",
      config.bitrate,
      "-c:a",
      "aac",
      "-b:a",
      config.audio_bitrate,
      "output.mp4",
    ];

    await ff.exec(command);

    const data = await ff.readFile("output.mp4");
    const blob = new Blob([data.buffer], { type: "video/mp4" });

    await ff.deleteFile("input.mp4");
    await ff.deleteFile("output.mp4");

    return blob;
  } catch (error) {
    console.error("Error exporting for social media:", error);
    throw error;
  }
}

/**
 * Download video file
 */
export function downloadVideo(blob, filename = "video.mp4") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
