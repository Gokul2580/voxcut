import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Bot, User, Zap, Scissors, RotateCcw, Type, Trash2, Copy, Gauge, Clapperboard, Volume2, Mic, Radio, Check, X, Lightbulb, Undo2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  { icon: Volume2,      label: "Add background music",   text: "Insert background music" },
  { icon: Clapperboard, label: "Add intro video",        text: "Add intro video" },
  { icon: Scissors,     label: "Trim first clip to 5s",  text: "Trim the first clip to 5 seconds" },
  { icon: Copy,         label: "Duplicate first clip",   text: "Duplicate the first clip" },
  { icon: Gauge,        label: "Speed up to 2x",         text: "Change the first clip playback speed to 2x" },
  { icon: Clapperboard, label: "Add fade transition",    text: "Add a fade transition to the first clip" },
];

const BEGINNER_SUGGESTIONS = [
  { icon: Scissors,     label: "Make this shorter",       text: "Trim the first clip to 5 seconds",             tip: "Trimming removes unwanted parts from a clip." },
  { icon: Type,         label: "Add a title",             text: 'Add a text overlay saying "My Video"',          tip: "Text overlays appear on top of your video at a set time." },
  { icon: Clapperboard, label: "Smooth clip transition",  text: "Add a fade transition to the first clip",       tip: "Transitions create a smooth blend between clips." },
  { icon: Volume2,      label: "Silence this clip",       text: "Mute the first clip",                           tip: "Muting removes audio from a clip without deleting it." },
  { icon: Copy,         label: "Copy a clip",             text: "Duplicate the first clip",                      tip: "Duplicating creates an identical copy of the clip." },
  { icon: Gauge,        label: "Speed it up",             text: "Change the first clip playback speed to 2x",    tip: "Speed changes make the clip play faster or slower." },
];

const ACTION_CONFIGS = {
  trim_clip:             { icon: Scissors,     color: "text-blue-400 bg-blue-500/10 border-blue-500/20",      label: "Trimmed clip" },
  remove_clip:           { icon: Trash2,       color: "text-red-400 bg-red-500/10 border-red-500/20",         label: "Removed clip" },
  reorder_clips:         { icon: RotateCcw,    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",   label: "Reordered clips" },
  add_text_overlay:      { icon: Type,         color: "text-green-400 bg-green-500/10 border-green-500/20",   label: "Added text overlay" },
  set_volume:            { icon: Volume2,      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",      label: "Adjusted volume" },
  set_mute:              { icon: Volume2,      color: "text-slate-400 bg-slate-500/10 border-slate-500/20",   label: "Muted/Unmuted" },
  split_clip:            { icon: Scissors,     color: "text-violet-400 bg-violet-500/10 border-violet-500/20", label: "Split clip" },
  duplicate_clip:        { icon: Copy,         color: "text-teal-400 bg-teal-500/10 border-teal-500/20",      label: "Duplicated clip" },
  change_playback_speed: { icon: Gauge,        color: "text-orange-400 bg-orange-500/10 border-orange-500/20", label: "Changed speed" },
  add_transition:        { icon: Clapperboard, color: "text-pink-400 bg-pink-500/10 border-pink-500/20",      label: "Added transition" },
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }} />
      ))}
    </div>
  );
}

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIGS[action];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.color} mt-1.5`}>
      <Icon className="w-2.5 h-2.5" />{cfg.label}
    </div>
  );
}

/** Countdown confirmation bar for voice commands */
function ConfirmBar({ countdown, onConfirm, onCancel }) {
  return (
    <div className="mx-3 mb-2 rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-violet-300 font-medium flex items-center gap-1.5">
          <Mic className="w-3 h-3" /> Auto-executing in {countdown}s…
        </span>
        <div className="flex gap-1.5">
          <button onClick={onConfirm}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-[10px] font-medium transition-colors">
            <Check className="w-3 h-3" /> Run now
          </button>
          <button onClick={onCancel}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border/50 text-muted-foreground text-[10px] font-medium transition-colors">
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-border/40 rounded-full overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(countdown / 3) * 100}%` }} />
      </div>
    </div>
  );
}

function BeginnerBanner() {
  return (
    <div className="mx-3 mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 flex items-start gap-2">
      <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-semibold text-amber-300">Beginner Assist Mode</p>
        <p className="text-[10px] text-amber-200/70 mt-0.5 leading-snug">
          Suggestions and explanations are enabled. Try saying: <span className="font-medium text-amber-300">"Make this shorter"</span>
        </p>
      </div>
    </div>
  );
}

function UndoNudge({ onUndo }) {
  return (
    <div className="mx-3 mb-1 rounded-xl border border-border/30 bg-secondary/40 px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Undo2 className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Not happy? You can undo that edit.</span>
      </div>
      <button onClick={onUndo}
        className="text-[10px] font-medium text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10">
        Undo
      </button>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1 ring-1 ring-violet-500/20">
          <Bot className="w-3 h-3 text-violet-400" />
        </div>
      )}
      <div className={`max-w-[82%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-violet-500 to-blue-600 text-white rounded-tr-sm shadow-lg shadow-violet-500/20"
            : "bg-secondary/60 text-foreground rounded-tl-sm border border-border/30"
        }`}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-violet-300">
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        {msg.action && msg.action !== "voice_preview" && <ActionBadge action={msg.action} />}
        {msg.isVoice && <span className="text-[9px] text-violet-400/60 mt-0.5 px-1 flex items-center gap-0.5"><Mic className="w-2.5 h-2.5" /> voice</span>}
        <span className="text-[9px] text-muted-foreground/40 mt-0.5 px-1">{msg.time}</span>
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1 ring-1 ring-blue-500/20">
          <User className="w-3 h-3 text-blue-400" />
        </div>
      )}
    </div>
  );
}

/**
 * ChatPanel — pure UI.
 * Fires onIntent({ type: "command"|"voice_command"|"voice_confirm", ... }) to parent.
 * Receives pendingResult from parent to render assistant replies.
 */
export default function ChatPanel({ onIntent, pendingResult, beginnerMode, isProcessingCommand = false, isPlaying = false }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I'm your AI video editor. Describe what you want to do and I'll update the timeline instantly.\n\nTry: *\"Trim clip 1 to 5 seconds\"* or *\"Add a title text overlay\"*",
    time: "now",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const [showUndoNudge, setShowUndoNudge] = useState(false);
  const [activeTip, setActiveTip] = useState(null);

  // Confirmation state for voice commands
  const [pendingConfirm, setPendingConfirm] = useState(null); // { resolvedResult }
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef(null);

  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingConfirm]);

  // Parent resolved an intent — append assistant reply
  useEffect(() => {
    if (!pendingResult) return;
    const { responseMessage, action, requiresConfirmation, resolvedResult } = pendingResult;

    if (requiresConfirmation) {
      // Voice preview: show AI message + start countdown
      setMessages(prev => [...prev, { role: "assistant", content: responseMessage, action: "voice_preview", time: getTime() }]);
      setPendingConfirm({ resolvedResult });
      setCountdown(3);
      setLoading(false);
      return;
    }

    // Normal result: show and clear any confirmation
    if (responseMessage) {
      setMessages(prev => [...prev, { role: "assistant", content: responseMessage, action, time: getTime() }]);
    }
    setPendingConfirm(null);
    setLoading(false);
    inputRef.current?.focus();
    // Beginner mode: show undo nudge after any real edit
    if (beginnerMode && action && action !== "none" && action !== "voice_preview") {
      setShowUndoNudge(true);
      setTimeout(() => setShowUndoNudge(false), 6000);
    }
  }, [pendingResult]);

  // Countdown timer
  useEffect(() => {
    if (!pendingConfirm) {
      clearInterval(countdownRef.current);
      return;
    }
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          executeConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [pendingConfirm]);

  const executeConfirm = useCallback(() => {
    if (!pendingConfirm) return;
    clearInterval(countdownRef.current);
    onIntent({ type: "voice_confirm", resolvedResult: pendingConfirm.resolvedResult });
    setPendingConfirm(null);
  }, [pendingConfirm, onIntent]);

  const cancelConfirm = useCallback(() => {
    clearInterval(countdownRef.current);
    setPendingConfirm(null);
    setMessages(prev => [...prev, { role: "assistant", content: "Command cancelled.", action: "none", time: getTime() }]);
  }, []);

  // Send typed text
  const sendCommand = useCallback((text) => {
    const userMsg = text.trim();
    if (!userMsg || loading || isProcessingCommand) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg, time: getTime() }]);
    setLoading(true);
    onIntent({ type: "command", text: userMsg });
  }, [loading, onIntent]);

  // Voice
  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setIsRecording(false);
      // Voice path: show user bubble with voice badge, go through voice_command pipeline
      const userMsg = transcript.trim();
      if (!userMsg) return;
      setMessages(prev => [...prev, { role: "user", content: userMsg, isVoice: true, time: getTime() }]);
      setLoading(true);
      onIntent({ type: "voice_command", text: userMsg });
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="h-full flex flex-col bg-card/30">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-md shadow-violet-500/30">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-foreground">AI Editor</h3>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Powered by VOXCUT AI</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${loading || isProcessingCommand ? "bg-amber-400 animate-pulse" : isPlaying ? "bg-blue-400 animate-pulse" : "bg-green-400 animate-pulse"}`} />
          <span className={`text-[10px] ${loading || isProcessingCommand ? "text-amber-400" : isPlaying ? "text-blue-400" : "text-green-400"}`}>{loading || isProcessingCommand ? "Thinking…" : isPlaying ? "Playing" : "Online"}</span>
        </div>
      </div>

      {/* Beginner banner */}
      {beginnerMode && <BeginnerBanner />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1 ring-1 ring-violet-500/20">
              <Bot className="w-3 h-3 text-violet-400" />
            </div>
            <div className="bg-secondary/60 border border-border/30 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Voice confirmation bar */}
      {pendingConfirm && (
        <ConfirmBar countdown={countdown} onConfirm={executeConfirm} onCancel={cancelConfirm} />
      )}

      {/* Beginner: undo nudge */}
      {beginnerMode && showUndoNudge && (
        <UndoNudge onUndo={() => { setShowUndoNudge(false); sendCommand("undo"); }} />
      )}

      {/* Suggestion chips */}
      {(messages.length <= 1 || beginnerMode) && !pendingConfirm && (
        <div className="px-3 pb-2 flex flex-col gap-1.5 flex-shrink-0">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider px-0.5">
            {beginnerMode ? "✨ Try these" : "Quick actions"}
          </p>
          <div className={`grid gap-1.5 max-h-36 overflow-y-auto ${beginnerMode ? "grid-cols-1" : "grid-cols-2"}`}>
            {(beginnerMode ? BEGINNER_SUGGESTIONS : SUGGESTIONS).map(({ icon: Icon, label, text, tip }) => (
              <button key={label}
                onClick={() => { sendCommand(text); if (tip) setActiveTip(tip); }}
                disabled={loading || isProcessingCommand}
                   className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-secondary/40 hover:bg-secondary/70 border border-border/30 hover:border-violet-500/30 transition-all text-left group disabled:opacity-40">
                <Icon className="w-3 h-3 text-violet-400 flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight flex-1">{label}</span>
                {beginnerMode && tip && (
                  <span className="text-[9px] text-amber-400/60 hidden group-hover:block leading-tight ml-1 max-w-[80px] truncate">{tip}</span>
                )}
              </button>
            ))}
          </div>
          {/* Active tip */}
          {beginnerMode && activeTip && (
            <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-0.5">
              <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200/80 leading-snug">{activeTip}</p>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border/50 flex-shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); sendCommand(input); }} className="flex items-end gap-2">
          <div className="flex-1">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCommand(input); } }}
              placeholder="Describe your edit…" rows={1}
              disabled={loading || isProcessingCommand || !!pendingConfirm}
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all disabled:opacity-50 leading-snug"
              style={{ minHeight: 40, maxHeight: 100 }} />
          </div>
          {voiceSupported && (
            <button type="button" onClick={isRecording ? stopVoice : startVoice}
              disabled={loading || isProcessingCommand || !!pendingConfirm}
              title={isRecording ? "Stop recording" : "Voice command"}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                isRecording ? "bg-red-500 hover:bg-red-400 shadow-md shadow-red-500/30 animate-pulse"
                            : "bg-secondary/60 hover:bg-secondary border border-border/50 hover:border-violet-500/40"
              } disabled:opacity-30`}>
              {isRecording ? <Radio className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-muted-foreground" />}
            </button>
          )}
          <button type="submit" disabled={loading || isProcessingCommand || !input.trim() || !!pendingConfirm}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 hover:from-violet-400 hover:to-blue-500 disabled:opacity-30 flex items-center justify-center transition-all shadow-md shadow-violet-500/20 flex-shrink-0">
            {loading ? <Zap className="w-4 h-4 text-white animate-pulse" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </form>
        <p className="text-[9px] text-muted-foreground/40 text-center mt-2">
          {isRecording
            ? "🎙 Listening… speak your command"
            : beginnerMode
            ? '💡 Try saying: "Make this shorter"'
            : "Enter to send · Shift+Enter for new line"}
        </p>
      </div>
    </div>
  );
}