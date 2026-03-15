import React, {
  useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle,
} from "react";
import { Play, Pause, SkipBack, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { getClips, getTexts } from "./timelineHelpers";

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function effectiveDuration(clip) {
  return Math.max(0, (clip.duration || 0) - (clip.trimStart || 0) - (clip.trimEnd || 0));
}

function buildTimeline(clips) {
  let cursor = 0;
  return clips.map((clip) => {
    const dur = effectiveDuration(clip);
    const entry = { ...clip, startTime: cursor, endTime: cursor + dur };
    cursor += dur;
    return entry;
  });
}

function getActiveIndex(timedClips, t) {
  for (let i = 0; i < timedClips.length; i++) {
    if (t < timedClips[i].endTime) return i;
  }
  return timedClips.length - 1;
}

/** Imperative handle: { pause()→bool, resume(), seekTo(t), getPlayheadTime(), isPlaying() } */
const VideoPreview = forwardRef(function VideoPreview({ timeline, playSignal }, ref) {
  const rawClips   = getClips(timeline);
  const timedClips = buildTimeline(rawClips);
  const totalDuration = timedClips.length > 0 ? timedClips[timedClips.length - 1].endTime : 0;

  // UI state (needed to re-render transport + slider)
  const [playheadTime, setPlayheadTimeState] = useState(0);
  const [playing,      setPlaying]           = useState(false);
  const [muted,        setMuted]             = useState(false);

  // Refs — single source of truth for hot paths
  const playheadRef  = useRef(0);   // always in sync with playheadTime state
  const playingRef   = useRef(false);
  const rafRef       = useRef(null);
  const lastRafTime  = useRef(null);
  const videoRef     = useRef(null);

  // Keep ref in sync when setting state
  const setPlayheadTime = useCallback((val) => {
    const next = typeof val === "function" ? val(playheadRef.current) : val;
    playheadRef.current = next;
    setPlayheadTimeState(next);
  }, []);

  // Derived active clip
  const activeIndex = timedClips.length > 0
    ? getActiveIndex(timedClips, Math.min(playheadRef.current, totalDuration - 0.001))
    : -1;
  const activeClip = timedClips[activeIndex] ?? null;

  // ── RAF clock ───────────────────────────────────────────────────────────────
  const stopRaf = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    lastRafTime.current = null;
  }, []);

  const startRaf = useCallback(() => {
    stopRaf();
    lastRafTime.current = performance.now();
    const tick = (now) => {
      if (!playingRef.current) return;
      const delta = (now - lastRafTime.current) / 1000;
      lastRafTime.current = now;
      const next = Math.min(playheadRef.current + delta, totalDuration);
      playheadRef.current = next;
      setPlayheadTimeState(next);           // update UI
      if (next >= totalDuration) {
        playingRef.current = false;
        setPlaying(false);
        stopRaf();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [totalDuration, stopRaf]);

  // ── Sync video → playhead ───────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip) return;
    const expected = (activeClip.trimStart || 0) + (playheadRef.current - activeClip.startTime);
    if (Math.abs(video.currentTime - expected) > 0.25) {
      video.currentTime = expected;
    }
  }, [playheadTime]); // eslint-disable-line

  // ── Clip switch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip) return;
    const targetTime = (activeClip.trimStart || 0) + (playheadRef.current - activeClip.startTime);
    const onReady = () => {
      video.currentTime = Math.max(0, targetTime);
      if (playingRef.current) video.play().catch(() => {});
    };
    if (video.readyState >= 1) onReady();
    else video.addEventListener("loadedmetadata", onReady, { once: true });
  }, [activeIndex]); // eslint-disable-line

  // ── Controls ────────────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    if (!playingRef.current) return false;
    videoRef.current?.pause();
    playingRef.current = false;
    setPlaying(false);
    stopRaf();
    return true;
  }, [stopRaf]);

  const resume = useCallback(() => {
    if (playingRef.current || !activeClip) return;
    if (playheadRef.current >= totalDuration) {
      playheadRef.current = 0;
      setPlayheadTimeState(0);
    }
    videoRef.current?.play().catch(() => {});
    playingRef.current = true;
    setPlaying(true);
    startRaf();
  }, [activeClip, totalDuration, startRaf]);

  const seekTo = useCallback((t) => {
    const clamped = Math.min(Math.max(t, 0), totalDuration);
    playheadRef.current = clamped;
    setPlayheadTimeState(clamped);
    const idx  = getActiveIndex(timedClips, Math.min(clamped, totalDuration - 0.001));
    const clip = timedClips[idx];
    if (!clip || !videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, (clip.trimStart || 0) + (clamped - clip.startTime));
  }, [timedClips, totalDuration]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) pause();
    else resume();
  }, [pause, resume]);

  const restart = useCallback(() => {
    pause();
    seekTo(0);
  }, [pause, seekTo]);

  // ── Slider seek (handles onValueChange array) ───────────────────────────────
  const handleSliderChange = useCallback((value) => {
    seekTo(value[0]);
  }, [seekTo]);

  // ── External signals ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playSignal) return;
    togglePlay();
  }, [playSignal]); // eslint-disable-line

  useEffect(() => () => stopRaf(), [stopRaf]);

  // ── Imperative handle ───────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    pause,
    resume,
    seekTo,
    getPlayheadTime: () => playheadRef.current,
    isPlaying: () => playingRef.current,
  }), [pause, resume, seekTo]);

  // ── Text overlays ───────────────────────────────────────────────────────────
  const activeTexts = getTexts(timeline).filter(
    (t) => playheadTime >= (t.startTime || 0) && playheadTime < (t.startTime || 0) + (t.duration || 5)
  );

  return (
    <div className="h-full flex flex-col bg-black/40 rounded-xl overflow-hidden border border-border/30">

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center bg-black relative min-h-0 overflow-hidden">
        {activeClip ? (
          <>
            <video
              key={activeClip.id}
              ref={videoRef}
              src={activeClip.src}
              className="max-h-full max-w-full object-contain"
              muted={muted}
              playsInline
              preload="auto"
            />
            {activeTexts.map((text, i) => (
              <div
                key={i}
                className="absolute pointer-events-none drop-shadow-lg"
                style={{
                  top: `${text.y ?? 80}%`, left: `${text.x ?? 50}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: text.fontSize || 24,
                  color: text.color || "#ffffff",
                  fontWeight: text.bold ? "bold" : "normal",
                  zIndex: 10,
                }}
              >
                {text.content}
              </div>
            ))}
          </>
        ) : (
          <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Play className="w-12 h-12 opacity-20" />
            <span className="text-xs opacity-60">Add clips to the timeline to preview</span>
          </div>
        )}
      </div>

      {/* Clip strip */}
      {timedClips.length > 1 && (
        <div className="flex gap-0.5 px-3 pt-2">
          {timedClips.map((c, i) => (
            <div
              key={c.id || i}
              title={c.name}
              className="h-1.5 rounded-full cursor-pointer"
              style={{ flex: effectiveDuration(c) || 1 }}
              onClick={() => seekTo(c.startTime)}
            >
              <div className={`h-full w-full rounded-full transition-colors ${
                i === activeIndex ? "bg-violet-500" : i < activeIndex ? "bg-violet-400/40" : "bg-border/60"
              }`} />
            </div>
          ))}
        </div>
      )}

      {/* Transport controls */}
      <div className="p-3 bg-card/80 backdrop-blur-sm border-t border-border/30">
        <Slider
          value={[playheadTime]}
          max={totalDuration || 100}
          step={0.05}
          onValueChange={handleSliderChange}
          className="mb-2"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={restart} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              disabled={!activeClip}
              className="p-2 rounded-full bg-primary hover:bg-primary/80 transition-colors disabled:opacity-30"
            >
              {playing
                ? <Pause className="w-4 h-4 text-primary-foreground" />
                : <Play  className="w-4 h-4 text-primary-foreground ml-0.5" />}
            </button>
            <button onClick={() => setMuted(!muted)} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {timedClips.length > 0 && (
              <span className="text-[10px] text-muted-foreground">{activeIndex + 1} / {timedClips.length}</span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {formatTime(playheadTime)} / {formatTime(totalDuration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default VideoPreview;