const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function OneShotPanel({ open, onOpenChange, assets, projectId, onComplete }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim() || assets.length === 0) {
      toast.error("Please provide a prompt and upload media assets first");
      return;
    }

    setGenerating(true);
    setProgress("Analyzing your media assets...");

    try {
      // Step 1: Analyze assets with AI
      const assetList = assets.map(a => ({
        name: a.name,
        type: a.media_type,
        duration: a.duration,
        url: a.file_url
      }));

      setProgress("Planning video structure...");

      // Step 2: Let AI plan the entire video
      const planningPrompt = `You are a professional video editor. Given these media assets and the user's goal, create a complete video editing plan.

Assets available:
${assetList.map((a, i) => `${i + 1}. ${a.name} (${a.type}, ${a.duration}s)`).join('\n')}

User's goal: ${prompt}

Create a JSON timeline that:
- Selects the best clips from available assets
- Arranges them in a compelling sequence
- Adds appropriate text overlays at key moments
- Removes any bad takes or silent portions
- Creates smooth transitions
- Aims for a ${prompt.toLowerCase().includes('short') ? '30-60' : '60-120'} second final video

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "clips": [
    {
      "id": "clip_1",
      "assetName": "name of asset from the list above",
      "src": "asset url",
      "name": "descriptive clip name",
      "start": 0,
      "duration": 5,
      "trimStart": 0,
      "trimEnd": 0,
      "order": 1,
      "volume": 1.0,
      "transition": "fade"
    }
  ],
  "texts": [
    {
      "id": "text_1",
      "content": "Your Text Here",
      "startTime": 2,
      "duration": 3,
      "x": 50,
      "y": 50,
      "fontSize": 48,
      "color": "#FFFFFF",
      "bold": true
    }
  ],
  "settings": {
    "aspectRatio": "16:9",
    "resolution": "1920x1080",
    "fps": 30
  }
}`;

      const planResult = await db.integrations.Core.InvokeLLM({
        prompt: planningPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            clips: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  assetName: { type: "string" },
                  src: { type: "string" },
                  name: { type: "string" },
                  start: { type: "number" },
                  duration: { type: "number" },
                  trimStart: { type: "number" },
                  trimEnd: { type: "number" },
                  order: { type: "number" },
                  volume: { type: "number" },
                  transition: { type: "string" }
                }
              }
            },
            texts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  content: { type: "string" },
                  startTime: { type: "number" },
                  duration: { type: "number" },
                  x: { type: "number" },
                  y: { type: "number" },
                  fontSize: { type: "number" },
                  color: { type: "string" },
                  bold: { type: "boolean" }
                }
              }
            },
            settings: {
              type: "object",
              properties: {
                aspectRatio: { type: "string" },
                resolution: { type: "string" },
                fps: { type: "number" }
              }
            }
          }
        }
      });

      setProgress("Generating your video timeline...");

      // Step 3: Map asset names to actual URLs
      const timeline = {
        clips: planResult.clips.map(clip => ({
          ...clip,
          src: assets.find(a => a.name === clip.assetName || a.file_url === clip.src)?.file_url || clip.src
        })),
        texts: planResult.texts || [],
        settings: planResult.settings || {
          aspectRatio: "16:9",
          resolution: "1920x1080",
          fps: 30
        },
        tracks: [
          { id: "video_track_1", type: "video", clips: planResult.clips },
          { id: "audio_track_1", type: "audio", clips: [] },
          { id: "text_track", type: "text", elements: planResult.texts || [] }
        ]
      };

      // Step 4: Save timeline
      setProgress("Saving timeline...");
      const timelineRecords = await db.entities.Timeline.filter({ project_id: projectId });
      if (timelineRecords.length > 0) {
        await db.entities.Timeline.update(timelineRecords[0].id, { timeline_json: timeline });
      }

      setProgress("Complete!");
      
      setTimeout(() => {
        onComplete?.(timeline);
        onOpenChange(false);
        setPrompt("");
        setProgress("");
        toast.success("AI generated your video!");
      }, 500);

    } catch (error) {
      console.error("One-shot generation error:", error);
      toast.error("Failed to generate video. Please try again.");
      setProgress("");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            One-Shot AI Generation
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Describe your video and let AI create the entire edit from your uploaded media.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>What video do you want to create?</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create an engaging 60-second highlight reel showing the best moments. Remove any silent sections or mistakes. Add text overlays introducing each section. Make it professional and dynamic."
              className="h-32 bg-secondary/50 border-border/50 resize-none"
              disabled={generating}
            />
          </div>

          <div className="rounded-lg bg-secondary/30 border border-border/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">💡 Tips for best results:</p>
            <ul className="space-y-0.5 ml-4 list-disc">
              <li>Be specific about the video style and pacing</li>
              <li>Mention if you want text overlays or captions</li>
              <li>Specify target duration (e.g., "60 seconds")</li>
              <li>Upload your raw clips first</li>
            </ul>
          </div>

          {assets.length > 0 && (
            <div className="text-xs text-muted-foreground">
              ✓ {assets.length} media asset{assets.length !== 1 ? 's' : ''} ready to use
            </div>
          )}

          {progress && (
            <div className="flex items-center gap-2 text-sm text-violet-400 bg-violet-500/10 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || assets.length === 0 || generating}
            className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 shadow-lg shadow-violet-500/20"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Video with AI
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}