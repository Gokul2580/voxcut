const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback, useReducer, useRef } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clapperboard, ChevronLeft, Save, Loader2, Download, MessageSquare, X, Lightbulb, Sparkles, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MediaLibrary from "@/components/editor/MediaLibrary";
import VideoPreview from "@/components/editor/VideoPreview";
import TimelineTrack from "@/components/editor/TimelineTrack";
import ChatPanel from "@/components/editor/ChatPanel";
import RenderModal from "@/components/editor/RenderModal";
import OneShotPanel from "@/components/editor/OneShotPanel";
import ClipEditPanel from "@/components/editor/ClipEditPanel";
import { timelineReducer } from "@/components/editor/timelineReducer";
import { ensureTracks, inferMediaType } from "@/components/editor/timelineHelpers";
import { smartInsertAsset } from "@/components/editor/smartInsertAsset";
import { executeEditorIntent } from "@/components/editor/editorPipeline";
import { useEditorState } from "@/components/editor/useEditorState";

export default function Editor() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("projectId");

  const [timeline, dispatchTimeline] = useReducer(timelineReducer, { clips: [], texts: [] });
  const setTimeline = (tl) => dispatchTimeline({ type: "__set__", __payload: tl });
  const [timelineRecord, setTimelineRecord] = useState(null);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const {
    isProcessingCommand, isRendering, isPlaying, isBusy,
    startCommand, finishCommand, startRender, finishRender, startPlay, stopPlay,
  } = useEditorState();
  const [saving, setSaving] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [renderOpen, setRenderOpen] = useState(false);
  const [renderAutoStart, setRenderAutoStart] = useState(false);
  const [beginnerMode, setBeginnerMode] = useState(false);
  const [oneShotOpen, setOneShotOpen] = useState(false);
  const [highlightedClipId, setHighlightedClipId] = useState(null);
  const [editingClip, setEditingClip] = useState(null);
  const navigate = useNavigate();
  const [localAssets, setLocalAssets] = useState([]);
  const [timelinePlayhead, setTimelinePlayhead] = useState(0);
  const videoPreviewRef = useRef(null);
  const needleRafRef    = useRef(null);
  const wasPausedRef    = useRef(false);   // track if we paused due to drag

  // Poll VideoPreview playhead to drive timeline needle — avoids extra state in VideoPreview
  useEffect(() => {
    const tick = () => {
      const t = videoPreviewRef.current?.getPlayheadTime?.() ?? 0;
      setTimelinePlayhead(t);
      needleRafRef.current = requestAnimationFrame(tick);
    };
    needleRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(needleRafRef.current);
  }, []);

  const handleTimelineDragStart = useCallback(() => {
    const wasPlaying = videoPreviewRef.current?.pause?.();
    wasPausedRef.current = wasPlaying;   // true if we actually paused it
  }, []);

  const handleTimelineDragEnd = useCallback(() => {
    if (wasPausedRef.current) {
      videoPreviewRef.current?.resume?.();
      wasPausedRef.current = false;
    }
  }, []);

  // Chat bridge: pendingResult is passed to ChatPanel to append assistant replies
  const [pendingResult, setPendingResult] = useState(null);
  // Play/pause signal for VideoPreview
  const [playSignal, setPlaySignal] = useState(0);
  // Undo history
  const timelineHistory = useRef([]);
  // Session context — tracks last edited clip, recent commands, current goal
  const sessionContext = useRef({ lastClipId: null, lastClipName: null, recentCommands: [], currentGoal: null });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => db.entities.Project.filter({ id: projectId }),
    enabled: !!projectId,
    select: (d) => d[0],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets", projectId],
    queryFn: () => db.entities.MediaAsset.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: timelines } = useQuery({
    queryKey: ["timeline", projectId],
    queryFn: () => db.entities.Timeline.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  useEffect(() => { setLocalAssets(assets); }, [assets]);

  useEffect(() => {
    if (!timelines?.length) return;
    setTimelineRecord(timelines[0]);
    const tl = timelines[0].timeline_json;
    if (typeof tl === "object" && tl !== null) setTimeline(tl);
    else if (typeof tl === "string") { try { setTimeline(JSON.parse(tl)); } catch { setTimeline({ clips: [], texts: [] }); } }
    else setTimeline({ clips: [], texts: [] });
  }, [timelines]);

  // ── Persistence ────────────────────────────────────────────────────────────

  const saveTimeline = useCallback(async (tl) => {
    if (!timelineRecord?.id) return;
    setSaving(true);
    try {
      const cleanedTimeline = ensureTracks(tl);
      await db.entities.Timeline.update(timelineRecord.id, { timeline_json: cleanedTimeline });
      setSaving(false);
    } catch (error) {
      console.error("Save error:", error);
      setSaving(false);
      toast.error("Failed to save timeline");
    }
  }, [timelineRecord]);

  // Auto-save on timeline changes
  useEffect(() => {
    if (!timeline || !timelineRecord) return;
    const debounce = setTimeout(() => {
      saveTimeline(timeline);
    }, 1500);
    return () => clearTimeout(debounce);
  }, [timeline, timelineRecord, saveTimeline]);

  // ── Central Intent Handler ─────────────────────────────────────────────────
  /**
   * All editor inputs (chat, voice, buttons, shortcuts) call handleIntent().
   * It runs the unified pipeline and routes the result.
   */
  const handleIntent = useCallback(async (intent) => {
    if (isBusy && intent.type !== "action") return; // block new commands while busy
    startCommand();
    // Attach current session context so AI can resolve pronouns
    const intentWithContext = (intent.type === "command" || intent.type === "voice_command")
      ? { ...intent, sessionContext: sessionContext.current, assets: localAssets }
      : intent;
    const result = await executeEditorIntent(intentWithContext, timeline);
    finishCommand();
    const { updatedTimeline, action } = result;

    if (action === "export") {
      // If triggered by AI (export_video), auto-start the render
      const fromAI = intent.type === "command" || intent.type === "voice_command" || intent.type === "voice_confirm";
      setRenderAutoStart(fromAI);
      setRenderOpen(true);
      startRender();
      return;
    }

    if (action === "play") {
      setPlaySignal(s => s + 1);
      startPlay();
      return;
    }

    if (action === "undo") {
      setTimeline(prev => {
        const history = timelineHistory.current;
        if (history.length < 2) return prev;
        history.pop(); // remove current
        const last = history[history.length - 1];
        saveTimeline(last);
        return last;
      });
      setPendingResult({ updatedTimeline: timeline, responseMessage: "Undid the last change.", action: "none", _ts: Date.now() });
      return;
    }

    // voice_preview: don't apply timeline changes, just surface to ChatPanel for confirmation
    if (action === "voice_preview") {
      setPendingResult({ ...result, _ts: Date.now() });
      return;
    }

    if (action !== "none") {
      timelineHistory.current = [...timelineHistory.current.slice(-19), updatedTimeline]; // keep last 20
      const cleanedTimeline = ensureTracks(updatedTimeline);
      setTimeline(cleanedTimeline);
      saveTimeline(cleanedTimeline);
      // Update session context
      const sc = sessionContext.current;
      if (result.affectedClipId) {
        const clipName = result.responseMessage?.match(/\*\*(.+?)\*\*/)?.[1] || result.affectedClipId;
        sc.lastClipId = result.affectedClipId;
        sc.lastClipName = clipName;
      }
      if (intent.text) {
        sc.recentCommands = [...sc.recentCommands.slice(-4), intent.text];
      }

      if (action === "insert_media") {
        // Find the newly inserted clip by diffing old vs new clips across all tracks
        const oldClipIds = new Set(
          (timeline.clips || []).map(c => c.id)
            .concat((timeline.tracks?.find(t => t.type === "audio")?.clips || []).map(c => c.id))
        );
        
        // Check video track first
        let newClip = (updatedTimeline.clips || []).find(c => !oldClipIds.has(c.id));
        let isAudioInsert = false;
        
        // If not found, check audio track
        if (!newClip) {
          newClip = (updatedTimeline.tracks?.find(t => t.type === "audio")?.clips || []).find(c => !oldClipIds.has(c.id));
          isAudioInsert = true;
        }
        
        if (newClip) {
          setSelectedClipId(newClip.id);
          setHighlightedClipId(newClip.id);
          setTimeout(() => setHighlightedClipId(null), 2500);
          sc.lastClipId = newClip.id;
          sc.lastClipName = newClip.name || "inserted clip";
          
          // Show background music message if applicable
          if (isAudioInsert && newClip.isBackgroundMusic) {
            result.responseMessage = "Added as background music.";
          }
        }
      } else if (action === "remove_clip" && selectedClipId) {
        setSelectedClipId(null);
        setHighlightedClipId(null);
      } else if (result.affectedClipId) {
        setSelectedClipId(result.affectedClipId);
        setHighlightedClipId(result.affectedClipId);
        setTimeout(() => setHighlightedClipId(null), 2500);
      }
    }

    // Surface reply to ChatPanel
    if (result.responseMessage) {
      setPendingResult({ ...result, _ts: Date.now() });
    }
  }, [timeline, saveTimeline, selectedClipId]);

  // ── Asset & timeline helpers (direct actions) ──────────────────────────────

  const handleAddToTimeline = useCallback((assetOrId) => {
    const asset = typeof assetOrId === "string"
      ? localAssets.find(a => a.id === assetOrId)
      : assetOrId;

    if (!asset) { toast.error("Asset not found."); return; }

    const result = smartInsertAsset(asset, timeline, timelinePlayhead);
    
    if (!result.success) {
      toast.error(result.error || "Failed to add asset.");
      return;
    }

    const cleanedTimeline = ensureTracks(result.timeline);
    setTimeline(cleanedTimeline);
    saveTimeline(cleanedTimeline);

    const mediaType = asset.media_type || inferMediaType(asset.file_type) || inferMediaType(asset.name) || "video";
    const trackLabel = mediaType === "audio" ? "audio track" : mediaType === "image" ? "image overlay" : "video track";
    toast.success(`Added "${asset.name}" to ${trackLabel}`);
  }, [timeline, localAssets, timelinePlayhead, saveTimeline]);

  const handleSetTransition = useCallback((clipId, transitionType) => {
    handleIntent({ type: "action", action: "add_transition", clipId, transitionType, transitionDuration: 0.5 });
  }, [handleIntent]);

  const handleRemoveClip = useCallback((clipId) => {
    handleIntent({ type: "action", action: "remove_clip", clipId });
  }, [handleIntent]);

  const handleReorder = useCallback((reorderedClips) => {
    const updated = ensureTracks({ ...timeline, clips: reorderedClips });
    setTimeline(updated);
    saveTimeline(updated);
  }, [timeline, saveTimeline]);

  const handleEditClip = useCallback((clipId) => {
    const clips = timeline.clips || [];
    const videoTrack = timeline.tracks?.find(t => t.type === "video");
    const allClips = [...clips, ...(videoTrack?.clips || [])];
    const clip = allClips.find(c => c.id === clipId);
    if (clip) {
      setEditingClip(clip);
    }
  }, [timeline]);

  const handleClipUpdate = useCallback((updatedClip) => {
    let updated = { ...timeline };
    
    // Update in clips array
    if (updated.clips) {
      updated.clips = updated.clips.map(c => c.id === updatedClip.id ? updatedClip : c);
    }
    
    // Update in tracks
    if (updated.tracks) {
      updated.tracks = updated.tracks.map(track => {
        if (track.clips) {
          return {
            ...track,
            clips: track.clips.map(c => c.id === updatedClip.id ? updatedClip : c)
          };
        }
        return track;
      });
    }
    
    updated = ensureTracks(updated);
    setTimeline(updated);
    saveTimeline(updated);
    toast.success("Clip updated");
  }, [timeline, saveTimeline]);

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No project selected.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="h-12 border-b border-border/50 flex items-center justify-between px-3 bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Dashboard")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Clapperboard className="w-3 h-3 text-white" />
            </div>
          </Link>
          <span className="font-semibold text-sm">{project?.name || "Loading..."}</span>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          <Button size="sm" variant="outline"
            className="h-8 text-xs border-violet-500/50 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 shadow-lg shadow-violet-500/10"
            onClick={() => setOneShotOpen(true)}
            disabled={isBusy}
            title="Generate complete video with AI from your raw clips">
            <Sparkles className="w-3 h-3 mr-1.5" />
            <span className="hidden sm:inline">One-Shot AI</span>
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs border-border/50"
            onClick={() => saveTimeline(timeline)}
            disabled={isBusy}>
            <Save className="w-3 h-3 mr-1.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          {/* Export goes through the intent pipeline */}
          <Button size="sm"
            className="h-8 text-xs bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
            onClick={() => handleIntent({ type: "export" })}
            disabled={isBusy}>
            <Download className="w-3 h-3 mr-1.5" />Export
          </Button>
          <Button size="sm" variant="outline"
            className={`h-8 text-xs border-border/50 ${beginnerMode ? "border-amber-500/50 text-amber-400 bg-amber-500/10" : ""}`}
            onClick={() => setBeginnerMode(v => !v)}
            title="Toggle Beginner Assist Mode">
            <Lightbulb className="w-3 h-3 mr-1.5" />
            <span className="hidden sm:inline">Assist</span>
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-border/50 lg:hidden"
            onClick={() => setChatOpen(v => !v)}>
            {chatOpen ? <X className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Media Library */}
        <div className="w-56 border-r border-border/50 flex-shrink-0 hidden md:block">
          <MediaLibrary
            assets={localAssets}
            projectId={projectId}
            onAssetAdded={(a) => setLocalAssets(prev => [...prev, a])}
            onAddToTimeline={handleAddToTimeline}
            onAssetDeleted={(id) => setLocalAssets(prev => prev.filter(a => a.id !== id))}
          />
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-3 min-h-0">
            <VideoPreview ref={videoPreviewRef} timeline={timeline} assets={localAssets} playSignal={playSignal} />
          </div>
          <div className="h-48 border-t border-border/50 flex-shrink-0 relative">
            <TimelineTrack
              timeline={timeline}
              onSelectClip={setSelectedClipId}
              selectedClipId={selectedClipId}
              onRemoveClip={handleRemoveClip}
              onSetTransition={handleSetTransition}
              onReorder={handleReorder}
              playheadTime={timelinePlayhead}
              onDragStart={handleTimelineDragStart}
              onDragEnd={handleTimelineDragEnd}
              highlightedClipId={highlightedClipId}
            />
            {selectedClipId && (
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 h-7 text-xs bg-card/90 backdrop-blur-sm border-violet-500/30 hover:bg-violet-500/10"
                onClick={() => handleEditClip(selectedClipId)}
              >
                <Settings2 className="w-3 h-3 mr-1.5" />
                Edit Selected Clip
              </Button>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className={`w-80 border-l border-border/50 flex-shrink-0 lg:block ${chatOpen ? "block absolute right-0 top-0 bottom-0 z-30 bg-card shadow-2xl" : "hidden"}`}>
          <ChatPanel
            onIntent={handleIntent}
            pendingResult={pendingResult}
            beginnerMode={beginnerMode}
            isProcessingCommand={isProcessingCommand}
            isPlaying={isPlaying}
          />
        </div>
      </div>

      <RenderModal
        open={renderOpen}
        onClose={() => { setRenderOpen(false); setRenderAutoStart(false); finishRender(); }}
        timeline={timeline}
        autoStart={renderAutoStart}
        onComplete={() => navigate("/Dashboard")}
      />

      <OneShotPanel
        open={oneShotOpen}
        onOpenChange={setOneShotOpen}
        assets={localAssets}
        projectId={projectId}
        onComplete={(newTimeline) => {
          const cleanedTimeline = ensureTracks(newTimeline);
          setTimeline(cleanedTimeline);
          saveTimeline(cleanedTimeline);
        }}
      />

      {editingClip && (
        <ClipEditPanel
          clip={editingClip}
          onClose={() => setEditingClip(null)}
          onUpdate={handleClipUpdate}
        />
      )}
    </div>
  );
}