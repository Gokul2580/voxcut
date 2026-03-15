const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Scissors,
  Gauge,
  Volume2,
  Sparkles,
  Loader2,
  X,
  Crop,
  Wand2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export default function ClipEditPanel({ clip, onClose, onUpdate }) {
  const [editPrompt, setEditPrompt] = useState("");
  const [processing, setProcessing] = useState(false);
  const [trimStart, setTrimStart] = useState(clip.trimStart || 0);
  const [trimEnd, setTrimEnd] = useState(clip.trimEnd || 0);
  const [speed, setSpeed] = useState(clip.speed || 1);
  const [volume, setVolume] = useState(clip.volume ?? 1);
  const [muted, setMuted] = useState(clip.muted || false);

  const effectiveDuration = (clip.duration || 0) - trimStart - trimEnd;

  const handleAIEdit = async () => {
    if (!editPrompt.trim()) return;
    setProcessing(true);

    try {
      const prompt = `You are editing a specific video clip. Current clip details:
- Name: "${clip.name}"
- Duration: ${clip.duration}s
- Current trim start: ${trimStart}s
- Current trim end: ${trimEnd}s
- Current speed: ${speed}x
- Volume: ${Math.round(volume * 100)}%

User wants to: "${editPrompt}"

Return JSON with the updated clip properties based on the user's request.`;

      const result = await db.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            trimStart: { type: "number" },
            trimEnd: { type: "number" },
            speed: { type: "number" },
            volume: { type: "number" },
            muted: { type: "boolean" },
            effects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  intensity: { type: "number" },
                },
              },
            },
          },
        },
      });

      // Apply AI suggestions
      if (result.trimStart !== undefined) setTrimStart(result.trimStart);
      if (result.trimEnd !== undefined) setTrimEnd(result.trimEnd);
      if (result.speed !== undefined) setSpeed(result.speed);
      if (result.volume !== undefined) setVolume(result.volume);
      if (result.muted !== undefined) setMuted(result.muted);

      setEditPrompt("");
    } catch (error) {
      console.error("AI edit failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleApply = () => {
    onUpdate({
      ...clip,
      trimStart,
      trimEnd,
      speed,
      volume,
      muted,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Edit Clip</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {clip.name || `Clip ${clip.order}`}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* AI Edit Prompt */}
          <div className="space-y-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Label className="text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              AI Edit This Clip
            </Label>
            <Textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g., Make it faster, Remove the first 3 seconds, Mute the audio"
              className="h-20 resize-none bg-background/50 text-xs"
              disabled={processing}
            />
            <Button
              size="sm"
              onClick={handleAIEdit}
              disabled={!editPrompt.trim() || processing}
              className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
            >
              {processing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3 mr-1.5" />
                  Apply AI Edit
                </>
              )}
            </Button>
          </div>

          {/* Manual Controls */}
          <div className="space-y-3">
            {/* Trim Start */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  Trim Start
                </span>
                <span className="text-muted-foreground">{trimStart}s</span>
              </Label>
              <Slider
                value={[trimStart]}
                onValueChange={([v]) => setTrimStart(Math.min(v, clip.duration - trimEnd - 1))}
                max={clip.duration - 1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Trim End */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 rotate-180" />
                  Trim End
                </span>
                <span className="text-muted-foreground">{trimEnd}s</span>
              </Label>
              <Slider
                value={[trimEnd]}
                onValueChange={([v]) => setTrimEnd(Math.min(v, clip.duration - trimStart - 1))}
                max={clip.duration - 1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Effective Duration */}
            <div className="text-xs text-center py-2 px-3 rounded-lg bg-secondary/50 border border-border/50">
              Effective duration: <span className="font-mono font-semibold">{effectiveDuration.toFixed(1)}s</span>
            </div>

            {/* Speed */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" />
                  Playback Speed
                </span>
                <span className="text-muted-foreground">{speed}x</span>
              </Label>
              <Slider
                value={[speed]}
                onValueChange={([v]) => setSpeed(v)}
                min={0.25}
                max={4}
                step={0.25}
                className="w-full"
              />
              <div className="flex gap-1">
                {[0.5, 1, 1.5, 2].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    onClick={() => setSpeed(s)}
                    className="flex-1 h-6 text-xs"
                  >
                    {s}x
                  </Button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  Volume
                </span>
                <span className="text-muted-foreground">{Math.round(volume * 100)}%</span>
              </Label>
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
                disabled={muted}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMuted(!muted)}
                className="w-full h-7 text-xs"
              >
                {muted ? "Unmute" : "Mute"} Audio
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-violet-500 hover:bg-violet-600">
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
}