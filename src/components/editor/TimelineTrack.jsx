import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Film, Music, Type, GripVertical, X, ChevronRight } from "lucide-react";
import { getClips, getAudioTrack, getTexts } from "./timelineHelpers";
import TransitionPicker from "./TransitionPicker";

const LABEL_W = 64; // px
const MIN_CLIP_PX = 64;

function formatDuration(s) {
  if (!s && s !== 0) return "0.0s";
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(0).padStart(2, "0");
    return `${m}:${sec}`;
  }
  return `${Number(s).toFixed(1)}s`;
}

function ClipBlock({ clip, index, selectedClipId, onSelectClip, onRemoveClip, onSetTransition, pxPerSec, highlighted }) {
  const clipW = Math.max((clip.duration || 10) * pxPerSec, MIN_CLIP_PX);
  const isSelected = selectedClipId === clip.id;
  const hues = [
    "from-violet-500/30 to-violet-600/20 border-violet-500/40",
    "from-blue-500/30 to-blue-600/20 border-blue-500/40",
    "from-cyan-500/30 to-cyan-600/20 border-cyan-500/40",
    "from-indigo-500/30 to-indigo-600/20 border-indigo-500/40",
    "from-purple-500/30 to-purple-600/20 border-purple-500/40",
  ];
  const colorClass = hues[index % hues.length];

  return (
    <Draggable draggableId={clip.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ ...provided.draggableProps.style, width: clipW, minWidth: MIN_CLIP_PX, flexShrink: 0 }}
          onClick={() => onSelectClip(clip.id)}
          className={`
            relative group h-full rounded-lg border cursor-pointer transition-all select-none
            bg-gradient-to-r ${colorClass}
            ${isSelected ? "ring-2 ring-violet-400 ring-offset-1 ring-offset-background shadow-lg shadow-violet-500/30 border-violet-400" : ""}
            ${highlighted ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-background shadow-lg shadow-amber-500/30 clip-active" : ""}
            ${snapshot.isDragging ? "shadow-2xl shadow-black/50 scale-105 z-50 opacity-90" : ""}
          `}
        >
          <div
            {...provided.dragHandleProps}
            className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-30 hover:opacity-70 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3 h-3 text-white" />
          </div>

          {/* Waveform decoration */}
          <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
            <div className="absolute bottom-0 left-6 right-6 flex items-end gap-px h-3 opacity-20">
              {Array.from({ length: Math.max(Math.floor(clipW / 6), 4) }, (_, i) => (
                <div key={i} className="flex-1 bg-white rounded-sm"
                  style={{ height: `${30 + Math.sin(i * 0.9) * 50 + Math.cos(i * 1.4) * 20}%` }} />
              ))}
            </div>
          </div>

          <div className="absolute inset-0 px-7 flex flex-col justify-center overflow-hidden">
            <span className="text-[11px] font-semibold text-white truncate leading-tight">
              {clip.name || `Clip ${clip.order}`}
            </span>
            <span className="text-[10px] text-white/60 font-mono mt-0.5">{formatDuration(clip.duration)}</span>
          </div>

          <div className="absolute top-1 right-1 w-4 h-4 rounded-sm bg-black/30 flex items-center justify-center">
            <span className="text-[9px] text-white/70 font-bold">{clip.order}</span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onRemoveClip(clip.id); }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive border border-background items-center justify-center hidden group-hover:flex z-10 shadow"
          >
            <X className="w-2.5 h-2.5 text-white" />
          </button>

          {isSelected && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-b-lg" />}

          {/* Transition picker button — only shown for clips after the first */}
          {index > 0 && onSetTransition && (
            <TransitionPicker clip={clip} onSet={onSetTransition} />
          )}
        </div>
      )}
    </Draggable>
  );
}

function AudioClipBlock({ clip, pxPerSec }) {
  const w = Math.max((clip.duration || 10) * pxPerSec, MIN_CLIP_PX);
  const barCount = Math.max(Math.floor(w / 4), 8);
  return (
    <div
      className="relative flex-shrink-0 h-full rounded-lg border border-green-500/40 bg-gradient-to-r from-green-900/40 to-emerald-900/20 overflow-hidden"
      style={{ width: w, minWidth: MIN_CLIP_PX }}
    >
      {/* Waveform bars */}
      <div className="absolute inset-0 flex items-center px-1 gap-px pointer-events-none">
        {Array.from({ length: barCount }, (_, i) => {
          const h = 20 + Math.abs(Math.sin(i * 0.7) * 55 + Math.cos(i * 1.3) * 25);
          return (
            <div
              key={i}
              className="flex-1 rounded-sm bg-green-400/60"
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      {/* Label overlay */}
      <div className="absolute bottom-0.5 left-2 right-2 flex items-center gap-1 pointer-events-none">
        <Music className="w-2.5 h-2.5 text-green-300 flex-shrink-0" />
        <span className="text-[9px] text-green-200 truncate font-medium">{clip.name}</span>
      </div>
    </div>
  );
}

function TrackRow({ label, icon: Icon, iconColor, height = 52, emptyText, children }) {
  return (
    <div className="flex items-center flex-shrink-0 px-3 mb-1" style={{ height }}>
      <div
        className={`flex-shrink-0 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground`}
        style={{ width: LABEL_W }}
      >
        <Icon className={`w-3 h-3 ${iconColor}`} />
        <span>{label}</span>
      </div>
      <div className="flex-1 h-full min-w-0">
        {children}
      </div>
    </div>
  );
}

export default function TimelineTrack({ timeline, onSelectClip, selectedClipId, onRemoveClip, onReorder, onSetTransition, playheadTime = 0, onDragStart, onDragEnd, highlightedClipId }) {
  const [containerRef, setContainerRef] = useState(null);
  const containerWidth = containerRef?.offsetWidth || 700;

  const clips = getClips(timeline);
  const audioClips = getAudioTrack(timeline).clips || [];
  const texts = getTexts(timeline);

  const totalDuration = Math.max(
    clips.reduce((s, c) => s + (c.duration || 10), 0),
    audioClips.reduce((s, c) => s + (c.duration || 10), 0),
    10
  );

  const usablePx = containerWidth - LABEL_W - 32;
  const pxPerSec = usablePx / totalDuration;

  const tickInterval = totalDuration <= 30 ? 5 : totalDuration <= 120 ? 10 : 30;
  const tickCount = Math.ceil(totalDuration / tickInterval) + 1;

  const handleDragStart = () => { onDragStart?.(); };

  const handleDragEnd = (result) => {
    onDragEnd?.();
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(clips);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const selectedClip = clips.find(c => c.id === selectedClipId);

  return (
    <div className="h-full flex flex-col bg-card/50">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-border/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h3>
          <span className="text-[10px] text-muted-foreground/60 bg-secondary/50 rounded px-1.5 py-0.5 font-mono">
            {clips.length} clip{clips.length !== 1 ? "s" : ""} · {formatDuration(totalDuration)}
          </span>
        </div>
        {selectedClip && (
          <div className="flex items-center gap-2 text-[10px] text-violet-400">
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium truncate max-w-28">{selectedClip.name || `Clip ${selectedClip.order}`}</span>
            <span className="font-mono text-muted-foreground">{formatDuration(selectedClip.duration)}</span>
          </div>
        )}
      </div>

      {/* Scrollable area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden" ref={setContainerRef}>
        <div
          style={{ minWidth: Math.max(usablePx + LABEL_W + 32, 400) }}
          className="h-full flex flex-col pb-1"
        >
          {/* Time ruler + playhead needle */}
          <div className="flex items-end flex-shrink-0 pt-1 relative" style={{ paddingLeft: LABEL_W + 16, paddingRight: 16 }}>
            {/* Playhead needle — spans entire height below ruler */}
            {totalDuration > 0 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-violet-400 opacity-80 pointer-events-none z-20"
                style={{ left: LABEL_W + 16 + (Math.min(playheadTime, totalDuration) / totalDuration) * usablePx }}
              >
                <div className="w-2 h-2 rounded-full bg-violet-400 -translate-x-1/2 -translate-y-0.5" />
              </div>
            )}
            <div className="relative flex-1 h-5">
              {Array.from({ length: tickCount }, (_, i) => {
                const t = i * tickInterval;
                return (
                  <div key={i} className="absolute flex flex-col items-center" style={{ left: t * pxPerSec }}>
                    <span className="text-[9px] text-muted-foreground/50 font-mono -translate-x-1/2 mb-0.5">
                      {formatDuration(t)}
                    </span>
                    <div className="w-px h-1.5 bg-border/40" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Video Track */}
          <TrackRow label="Video" icon={Film} iconColor="text-violet-400">
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <Droppable droppableId="video-track" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex gap-1.5 h-full rounded-lg transition-colors
                      ${snapshot.isDraggingOver ? "bg-violet-500/5 ring-1 ring-violet-500/20" : ""}
                      ${clips.length === 0 ? "flex-1 border border-dashed border-border/40 items-center justify-center" : ""}
                    `}
                  >
                    {clips.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground/40">Add clips from media library</span>
                    ) : (
                      clips.map((clip, i) => (
                        <ClipBlock
                        key={clip.id}
                        clip={clip}
                        index={i}
                        selectedClipId={selectedClipId}
                        onSelectClip={onSelectClip}
                        onRemoveClip={onRemoveClip}
                        onSetTransition={onSetTransition}
                        pxPerSec={pxPerSec}
                        highlighted={highlightedClipId === clip.id}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </TrackRow>

          {/* Audio Track */}
          <TrackRow label="Audio" icon={Music} iconColor="text-green-400" height={40}>
            <div
              className={`flex gap-1.5 h-full rounded-lg
                ${audioClips.length === 0 ? "flex-1 border border-dashed border-border/30 items-center justify-center" : ""}
              `}
            >
              {audioClips.length === 0 ? (
                <span className="text-[9px] text-muted-foreground/30">No audio clips</span>
              ) : (
                audioClips.map((clip, i) => (
                  <AudioClipBlock key={clip.id || i} clip={clip} pxPerSec={pxPerSec} />
                ))
              )}
            </div>
          </TrackRow>

          {/* Text Track */}
          <TrackRow label="Text" icon={Type} iconColor="text-amber-400" height={36}>
            <div
              className={`relative flex h-full rounded-lg
                ${texts.length === 0 ? "flex-1 border border-dashed border-border/30 items-center justify-center" : ""}
              `}
            >
              {texts.length === 0 ? (
                <span className="text-[9px] text-muted-foreground/30">No text overlays</span>
              ) : (
                texts.map((text, i) => {
                  const tw = Math.max((text.duration || 5) * pxPerSec, MIN_CLIP_PX);
                  const tl = (text.startTime || 0) * pxPerSec;
                  return (
                    <div
                      key={i}
                      className="absolute rounded-md bg-amber-500/20 border border-amber-500/40 px-2 flex items-center h-full"
                      style={{ width: tw, left: tl, minWidth: 40 }}
                    >
                      <span className="text-[10px] text-amber-300 truncate">{text.content}</span>
                    </div>
                  );
                })
              )}
            </div>
          </TrackRow>
        </div>
      </div>
    </div>
  );
}