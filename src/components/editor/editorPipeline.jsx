const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

/**
 * VOXCUT — Unified Editor Intent Pipeline
 *
 * Intent shapes:
 *   { type: "command",       text: string }              — typed text → AI → apply immediately
 *   { type: "voice_command", text: string }              — voice → AI → preview ("I will X. Proceed?") → confirm
 *   { type: "voice_confirm", resolvedResult: object }    — user/auto confirmed voice preview → apply
 *   { type: "action",        action: string, ...params } — direct reducer action (no AI)
 *   { type: "export" }                                   — open export/render modal
 */

import { timelineReducer } from "./timelineReducer";
import { getClips, getTexts } from "./timelineHelpers";
import { classifyIntent } from "./intentClassifier";
import { smartInsertAsset } from "./smartInsertAsset";
import { resolveAssetReference } from "./assetResolver";

// ─── Confirmation preview messages ("I will … Proceed?") ─────────────────────

const PREVIEW_MESSAGES = {
  trim_clip:             (cmd, tl) => { const n = clip(tl, cmd.clipId); return `I will trim **${n}** to **${cmd.duration}s**. Proceed?`; },
  remove_clip:           (cmd, tl) => { const n = clip(tl, cmd.clipId); return `I will remove **${n}** from the timeline. Proceed?`; },
  reorder_clips:         ()        => "I will reorder the clips. Proceed?",
  add_text_overlay:      (cmd)     => `I will add a text overlay saying **"${cmd.content}"**. Proceed?`,
  remove_text:           (cmd, tl) => { const t = getTexts(tl)[cmd.index]; return `I will remove the text overlay **"${t?.content || `#${cmd.index}`}"**. Proceed?`; },
  set_volume:            (cmd, tl) => { const n = clip(tl, cmd.clipId); return `I will set **${n}** volume to **${Math.round((cmd.volume ?? 1) * 100)}%**. Proceed?`; },
  set_mute:              (cmd, tl) => { const n = clip(tl, cmd.clipId); return cmd.muted ? `I will mute **${n}**. Proceed?` : `I will unmute **${n}**. Proceed?`; },
  split_clip:            (cmd, tl) => { const n = clip(tl, cmd.clipId); return `I will split **${n}** at **${cmd.splitAt}s**. Proceed?`; },
  duplicate_clip:        (cmd, tl) => { const n = clip(tl, cmd.clipId); return `I will duplicate **${n}**. Proceed?`; },
  change_playback_speed: (cmd, tl) => { const n = clip(tl, cmd.clipId); return `I will set **${n}** playback speed to **${cmd.speed}x**. Proceed?`; },
  add_transition:        (cmd, tl) => { const n = clip(tl, cmd.clipId); return `I will add a **${cmd.transitionType || "fade"}** transition to **${n}**. Proceed?`; },
  insert_media:          (cmd)     => `I will add the asset to the timeline. Proceed?`,
};

// ─── Confirmation messages (after execution) ──────────────────────────────────

const MESSAGES = {
  trim_clip:             (cmd, tl)      => { const n = clip(tl, cmd.clipId); return `Trimmed **${n}** to **${cmd.duration}s**.`; },
  remove_clip:           (cmd, _, prev) => { const n = clip(prev, cmd.clipId); return `Removed **${n}** from the timeline.`; },
  reorder_clips:         ()             => "Clips have been reordered.",
  add_text_overlay:      (cmd)          => `Added text overlay: **"${cmd.content}"**`,
  remove_text:           (cmd, _, prev) => { const t = getTexts(prev)[cmd.index]; return `Removed text overlay: **"${t?.content || `#${cmd.index}`}"**`; },
  set_volume:            (cmd, tl)      => { const n = clip(tl, cmd.clipId); return `Set **${n}** volume to **${Math.round((cmd.volume ?? 1) * 100)}%**.`; },
  set_mute:              (cmd, tl)      => { const n = clip(tl, cmd.clipId); return cmd.muted ? `Muted **${n}**.` : `Unmuted **${n}**.`; },
  split_clip:            (cmd, _, prev) => { const n = clip(prev, cmd.clipId); return `Split **${n}** at **${cmd.splitAt}s**.`; },
  duplicate_clip:        (cmd, _, prev) => { const n = clip(prev, cmd.clipId); return `Duplicated **${n}**.`; },
  change_playback_speed: (cmd, tl)      => { const n = clip(tl, cmd.clipId); return `Set **${n}** playback speed to **${cmd.speed}x**.`; },
  add_transition:        (cmd, tl)      => { const n = clip(tl, cmd.clipId); return cmd.transitionType === "none" ? `Removed transition from **${n}**.` : `Added **${cmd.transitionType || "fade"}** transition to **${n}**.`; },
  insert_media:          (cmd)          => `Added **${cmd._assetName || "asset"}** to the timeline.`,
};

// Helper
function clip(tl, id) { return getClips(tl).find(c => c.id === id)?.name || id; }

// ─── Fast asset insertion (no AI needed) ─────────────────────────────────────

function tryFastInsert(text, timeline, assets) {
  const asset = resolveAssetReference(text, assets);
  if (!asset) return null;
  const result = smartInsertAsset(asset, timeline);
  if (!result.success) {
    return { updatedTimeline: timeline, responseMessage: result.error, action: "none" };
  }
  const mediaType = asset.media_type || "video";
  const trackLabel = mediaType === "audio" ? "audio track" : mediaType === "image" ? "image overlay" : "video track";
  return {
    updatedTimeline: result.timeline,
    responseMessage: `Added **${asset.name}** to the ${trackLabel}.`,
    action: "insert_media",
    affectedClipId: null,
  };
}

// ─── Core: Parse (LLM call) ───────────────────────────────────────────────────

async function parseAICommand(text, timeline, sessionContext = {}, assets = []) {
  const clips = getClips(timeline);
  const texts = getTexts(timeline);

  const clipsSummary = clips
    .slice().sort((a, b) => a.order - b.order)
    .map(c => `- id:"${c.id}" name:"${c.name || "untitled"}" order:${c.order} duration:${c.duration}s`)
    .join("\n") || "(no clips)";

  const textsSummary = texts
    .map((t, i) => `- [${i}] "${t.content}" at (${t.x},${t.y}) for ${t.duration}s`)
    .join("\n") || "(none)";

  const assetsSummary = assets.length
    ? assets.map((a, i) => `- id:"${a.id}" name:"${a.name}" type:${a.media_type || "unknown"} (index:${i + 1})`).join("\n")
    : "(no assets in library)";

  const { lastClipId, lastClipName, recentCommands = [], currentGoal } = sessionContext;
  const contextSection = `
=== SESSION CONTEXT ===
Last edited clip: ${lastClipId ? `"${lastClipName}" (id: "${lastClipId}")` : "none yet"}
Recent commands: ${recentCommands.length ? recentCommands.map(c => `"${c}"`).join(" → ") : "none"}
${currentGoal ? `Current goal: "${currentGoal}"` : ""}

IMPORTANT: When the user refers to "it", "this", "the clip", "that", "this one", or similar pronouns without specifying a clip name, resolve the reference using the last edited clip from session context above.`;

  const prompt = `You are VOXCUT's video editing AI. Respond with valid JSON only.

=== CURRENT TIMELINE ===
CLIPS:
${clipsSummary}

TEXT OVERLAYS:
${textsSummary}

MEDIA LIBRARY (available assets to insert):
${assetsSummary}
${contextSection}
=== USER INSTRUCTION ===
"${text}"

=== AVAILABLE COMMANDS ===
1.  { "action": "trim_clip",             "clipId": "...", "duration": <number> }
2.  { "action": "remove_clip",           "clipId": "..." }
3.  { "action": "reorder_clips",         "clipIds": ["id1","id2",...] }
4.  { "action": "add_text_overlay",      "content": "...", "duration": <number>, "x": <0-100>, "y": <0-100>, "fontSize": <number>, "color": "#rrggbb" }
5.  { "action": "remove_text",           "index": <number> }
6.  { "action": "set_volume",            "clipId": "...", "volume": <0.0-1.0> }
7.  { "action": "set_mute",              "clipId": "...", "muted": <true|false> }
8.  { "action": "split_clip",            "clipId": "...", "splitAt": <seconds> }
9.  { "action": "duplicate_clip",        "clipId": "..." }
10. { "action": "change_playback_speed", "clipId": "...", "speed": <0.25-4.0> }
11. { "action": "add_transition",        "clipId": "...", "transitionType": "fade"|"wipe"|"dissolve", "transitionDuration": <seconds> }
12. { "action": "export_video" }
13. { "action": "insert_media",          "assetId": "<id from media library>", "targetTrack": "auto" }
    Use this when the user wants to add/insert/use an asset from the media library.
    Match the asset by name, type, or index ("first video", "my audio file", "background music", etc.).
    Always set targetTrack to "auto" — the system will route it correctly.
14. { "action": "none",                  "message": "friendly reply" }

Output ONLY raw JSON. No markdown, no explanation.`;

  return db.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        action:             { type: "string" },
        assetId:            { type: "string" },
        targetTrack:        { type: "string" },
        clipId:             { type: "string" },
        clipIds:            { type: "array", items: { type: "string" } },
        duration:           { type: "number" },
        content:            { type: "string" },
        x:                  { type: "number" },
        y:                  { type: "number" },
        fontSize:           { type: "number" },
        color:              { type: "string" },
        volume:             { type: "number" },
        muted:              { type: "boolean" },
        index:              { type: "number" },
        splitAt:            { type: "number" },
        speed:              { type: "number" },
        transitionType:     { type: "string" },
        transitionDuration: { type: "number" },
        message:            { type: "string" },
      },
      required: ["action"],
    },
  });
}

// ─── Core: Apply parsed command ───────────────────────────────────────────────

const FALLBACK_RESPONSE = "I didn't understand. Try saying 'trim first 5 seconds'.";

function applyParsedCommand(cmd, timeline, assets = []) {
  if (!cmd || typeof cmd.action !== "string") {
    return { updatedTimeline: timeline, responseMessage: FALLBACK_RESPONSE, action: "none" };
  }
  if (cmd.action === "export_video") {
    return { updatedTimeline: timeline, responseMessage: "Starting export...", action: "export" };
  }
  if (cmd.action === "insert_media") {
    const asset = assets.find(a => a.id === cmd.assetId);
    if (!asset) {
      return { updatedTimeline: timeline, responseMessage: "I couldn't find that asset in your media library.", action: "none" };
    }
    const result = smartInsertAsset(asset, timeline);
    if (!result.success) {
      return { updatedTimeline: timeline, responseMessage: result.error, action: "none" };
    }
    const mediaType = asset.media_type || "video";
    const trackLabel = mediaType === "audio" ? "audio track" : mediaType === "image" ? "image overlay" : "video track";
    return {
      updatedTimeline: result.timeline,
      responseMessage: `Added **${asset.name}** to the ${trackLabel}.`,
      action: "insert_media",
      affectedClipId: null,
    };
  }
  if (cmd.action === "none" || !MESSAGES[cmd.action]) {
    return {
      updatedTimeline: timeline,
      responseMessage: cmd.message || FALLBACK_RESPONSE,
      action: "none",
    };
  }
  try {
    const updatedTimeline = timelineReducer(timeline, { type: cmd.action, ...cmd });
    const msgFn = MESSAGES[cmd.action];
    const affectedClipId = cmd.clipId || null;
    return { updatedTimeline, responseMessage: msgFn(cmd, updatedTimeline, timeline), action: cmd.action, affectedClipId };
  } catch (e) {
    console.warn("[applyParsedCommand] Error applying command:", cmd.action, e);
    return { updatedTimeline: timeline, responseMessage: FALLBACK_RESPONSE, action: "none" };
  }
}

// ─── Direct action (no AI) ────────────────────────────────────────────────────

function runDirectAction(intent, timeline) {
  const { type: _t, ...cmd } = intent;
  return applyParsedCommand(cmd, timeline);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Central editor intent pipeline.
 *
 * Returns: { updatedTimeline, responseMessage, action, requiresConfirmation?, previewMessage?, resolvedResult? }
 */
export async function executeEditorIntent(intent, timeline) {
  try {
  return await _executeEditorIntent(intent, timeline);
  } catch (e) {
    console.warn("[executeEditorIntent] Unhandled error:", e);
    return { updatedTimeline: timeline, responseMessage: FALLBACK_RESPONSE, action: "none" };
  }
}

async function _executeEditorIntent(intent, timeline) {
  const assets = intent.assets || [];

  switch (intent.type) {

    case "command": {
      // Classify first — short-circuit non-edit intents before hitting the AI
      const classified = classifyIntent(intent.text);
      if (classified === "export") return { updatedTimeline: timeline, responseMessage: null, action: "export" };
      if (classified === "play")   return { updatedTimeline: timeline, responseMessage: null, action: "play" };
      if (classified === "undo")   return { updatedTimeline: timeline, responseMessage: null, action: "undo" };
      if (classified === "help")   return {
        updatedTimeline: timeline,
        responseMessage: "Here's what I can do:\n\n• **Trim** a clip to a specific length\n• **Remove** or **duplicate** clips\n• **Reorder** clips in the timeline\n• **Split** a clip at a given timestamp\n• **Add text overlays** with custom position, size, and color\n• **Adjust volume** or **mute** any clip\n• **Change playback speed** (0.25x – 4x)\n• **Add transitions** (fade, wipe, dissolve)\n• **Add media** from your library\n• **Export** your finished video\n\nJust describe what you want in plain English!",
        action: "none",
      };
      if (classified === "suggestion") {
        const cmd = await parseAICommand(
          `The user asked for improvement suggestions. Review the timeline and suggest 2-3 specific edits. Reply conversationally, no JSON.`,
          timeline, {}, assets
        );
        return { updatedTimeline: timeline, responseMessage: cmd.message || "Try adding a fade transition between clips, or a text overlay for context!", action: "none" };
      }
      // insert_media: try fast deterministic resolution first
      if (classified === "insert_media") {
        const fast = tryFastInsert(intent.text, timeline, assets);
        if (fast) return fast;
      }
      // edit → AI → apply immediately
      const cmd = await parseAICommand(intent.text, timeline, intent.sessionContext, assets);
      return applyParsedCommand(cmd, timeline, assets);
    }

    case "voice_command": {
      // Classify first for voice too
      const voiceClassified = classifyIntent(intent.text);
      if (voiceClassified === "export") return { updatedTimeline: timeline, responseMessage: null, action: "export" };
      if (voiceClassified === "play")   return { updatedTimeline: timeline, responseMessage: null, action: "play" };
      if (voiceClassified === "undo")   return { updatedTimeline: timeline, responseMessage: null, action: "undo" };

      // insert_media: fast resolve → confirm before applying
      if (voiceClassified === "insert_media") {
        const fast = tryFastInsert(intent.text, timeline, assets);
        if (fast) {
          return {
            updatedTimeline: timeline,
            responseMessage: `I will add **${fast.responseMessage.match(/\*\*(.+?)\*\*/)?.[1] || "the asset"}** to the timeline. Proceed?`,
            action: "voice_preview",
            requiresConfirmation: true,
            resolvedResult: fast,
          };
        }
      }
      // Voice: AI → build preview message → return for confirmation (NOT applied yet)
      const cmd = await parseAICommand(intent.text, timeline, intent.sessionContext, assets);
      if (cmd.action === "none" || !MESSAGES[cmd.action]) {
        return applyParsedCommand(cmd, timeline, assets); // conversational, no confirm needed
      }
      const previewFn = PREVIEW_MESSAGES[cmd.action];
      const previewMessage = previewFn
        ? previewFn(cmd, timeline)
        : `I will ${cmd.action.replace(/_/g, " ")}. Proceed?`;
      // Pre-compute the result but don't apply yet — pass it back for the caller to execute on confirm
      const resolvedResult = applyParsedCommand(cmd, timeline, assets);
      return {
        updatedTimeline: timeline,   // no change yet
        responseMessage: previewMessage,
        action: "voice_preview",
        requiresConfirmation: true,
        resolvedResult,              // ready to apply on confirm
      };
    }

    case "voice_confirm": {
      // User/auto confirmed — apply the pre-resolved result
      return intent.resolvedResult;
    }

    case "action": {
      return runDirectAction(intent, timeline);
    }

    case "export": {
      return { updatedTimeline: timeline, responseMessage: null, action: "export" };
    }

    default:
      return { updatedTimeline: timeline, responseMessage: FALLBACK_RESPONSE, action: "none" };
  }
}