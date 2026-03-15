/**
 * VOXCUT — Intent Classifier
 *
 * Runs BEFORE the AI call to short-circuit common intents.
 *
 * Returns one of:
 *   "edit"       — needs AI to parse and apply a timeline edit
 *   "export"     — open render/export modal
 *   "play"       — play/pause the timeline
 *   "undo"       — undo last action
 *   "help"       — user needs help / usage tips
 *   "suggestion" — user is asking what's possible
 */

const PATTERNS = [
  // ── export ────────────────────────────────────────────────────────────────
  {
    intent: "export",
    patterns: [
      /\bexport\b/i,
      /\brender\b/i,
      /\bdownload\b/i,
      /\bfinish(?:ed)?\s*(the\s*)?(video|project|film|edit|clip)?\b/i,
      /\bsave\s*(the\s*)?(video|project|film|edit|clip)\b/i,
      /\bgenerate\s*(the\s*)?(video|file)\b/i,
      /\bproduce\s*(the\s*)?(video|file)\b/i,
      /\bexport\s*now\b/i,
      /\bfinaliz[ei]\b/i,
      /\bdone editing\b/i,
      /\bwrap\s*(it\s*)?up\b/i,
      /\bget\s*(the\s*)?file\b/i,
      /\bmp4\b/i,
    ],
  },

  // ── play / pause ──────────────────────────────────────────────────────────
  {
    intent: "play",
    patterns: [
      /^\s*(play|pause|resume|stop\s*playing)\s*$/i,
      /\bplay\s*(the\s*)?(video|timeline|preview|clip)\b/i,
      /\bpause\s*(the\s*)?(video|timeline|preview|clip)\b/i,
      /\bstart\s*(playing|playback)\b/i,
      /\bstop\s*playback\b/i,
    ],
  },

  // ── undo ──────────────────────────────────────────────────────────────────
  {
    intent: "undo",
    patterns: [
      /^\s*undo\s*$/i,
      /\bundo\s*(that|last|it)?\b/i,
      /\brevert\s*(that|last|it)?\b/i,
      /\bgo\s*back\b/i,
      /\bundo\s*the\s*(last|previous)\s*(change|edit|action|step)\b/i,
    ],
  },

  // ── help ──────────────────────────────────────────────────────────────────
  {
    intent: "help",
    patterns: [
      /^\s*(help|help\s*me|how\s*does\s*this\s*work|what\s*can\s*(i|you)\s*do)\s*\??$/i,
      /\bhow\s+do\s+i\b/i,
      /\bwhat\s+(can|should)\s+i\s+(do|say|type)\b/i,
      /\blist\s+(all\s+)?(commands|actions|features)\b/i,
      /\bwhat\s+commands?\b/i,
    ],
  },

  // ── insert_media ──────────────────────────────────────────────────────────
  {
    intent: "insert_media",
    patterns: [
      /\badd\s+(background\s+music|music|audio|sound|soundtrack)\b/i,
      /\binsert\s+(clip|video|audio|image|photo|track|file|intro|outro)\b/i,
      /\buse\s+(the\s+)?(first|second|third|\d+\w*|my|this|that|an?)\s*(video|audio|clip|image|photo|file|track)?\b/i,
      /\bput\s+(the\s+)?.+\s+(on|in|into)\s+(the\s+)?(timeline|track)\b/i,
      /\badd\s+(my\s+)?(video|clip|audio|image|photo|file|intro|outro)\b/i,
      /\bplace\s+(the\s+)?.+\s+(on|in|into)\s+(the\s+)?(timeline|track)\b/i,
    ],
  },

  // ── suggestion ────────────────────────────────────────────────────────────
  {
    intent: "suggestion",
    patterns: [
      /\bsuggest\b/i,
      /\bany\s*(ideas|suggestions|tips|recommendations)\b/i,
      /\bwhat\s+(would|should)\s+(you|i)\s+(recommend|suggest|do)\b/i,
      /\bimprove\s*(this|the)?\s*(video|edit|timeline|project)\b/i,
      /\bmake\s*(it|the\s*video|this)\s*better\b/i,
    ],
  },
];

/**
 * Classify user input text into a high-level intent.
 * Falls back to "edit" when no pattern matches.
 *
 * @param {string} text
 * @returns {"edit"|"export"|"play"|"undo"|"help"|"suggestion"|"insert_media"}
 */
export function classifyIntent(text) {
  const t = text.trim();
  for (const { intent, patterns } of PATTERNS) {
    if (patterns.some(re => re.test(t))) return intent;
  }
  return "edit";
}