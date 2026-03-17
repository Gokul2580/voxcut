import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import {
  applyCinematicEnhancement,
  generateSmartCaptions,
  getColorGradeForMood,
} from "@/services/aiEnhancementService";

export default function CinematicEnhance({ clip, onEnhance, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMood, setSelectedMood] = useState("cinematic");

  const moods = [
    { id: "cinematic", label: "Cinematic", icon: "🎬" },
    { id: "vibrant", label: "Vibrant", icon: "✨" },
    { id: "moody", label: "Moody", icon: "🌙" },
    { id: "dramatic", label: "Dramatic", icon: "⚡" },
  ];

  const handleEnhance = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[v0] Starting cinematic enhancement...");

      // Apply automatic cinematic enhancement
      const enhancements = await applyCinematicEnhancement(clip);

      // Get color grade based on mood
      const colorGrade = getColorGradeForMood(selectedMood);
      enhancements.effects = {
        ...enhancements.effects,
        ...colorGrade,
      };

      console.log("[v0] Enhancement complete:", enhancements);

      // Call parent callback with enhanced clip
      onEnhance({
        ...clip,
        ...enhancements,
        enhanced: true,
        enhancedAt: new Date().toISOString(),
      });

      setLoading(false);
    } catch (err) {
      console.error("[v0] Enhancement error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <p className="text-xs font-semibold text-violet-300">One-Shot Enhancement</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Automatically apply cinematic effects: color grading, blur, transitions, and audio fade
      </p>

      <div className="grid grid-cols-2 gap-2">
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => setSelectedMood(mood.id)}
            disabled={loading || disabled}
            className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              selectedMood === mood.id
                ? "bg-violet-500 text-white"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>{mood.icon}</span>
            {mood.label}
          </button>
        ))}
      </div>

      <Button
        onClick={handleEnhance}
        disabled={loading || disabled}
        className="w-full h-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Enhancing...
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Apply {selectedMood} Style
          </>
        )}
      </Button>

      {error && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 flex gap-2 items-start">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
