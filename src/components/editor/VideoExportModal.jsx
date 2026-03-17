import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, Download, Check } from "lucide-react";
import {
  applyEffectsAndExport,
  exportHighQuality,
  exportForSocialMedia,
  downloadVideo,
  initFFmpeg,
} from "@/services/videoExportService";

export default function VideoExportModal({ project, clip, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [exportType, setExportType] = useState("standard");
  const [exportedFile, setExportedFile] = useState(null);

  const exportOptions = [
    {
      id: "standard",
      label: "Standard (MP4)",
      description: "Normal quality, good for playback",
      preset: "standard",
    },
    {
      id: "hq",
      label: "High Quality",
      description: "Best quality, larger file size",
      preset: "high",
    },
    {
      id: "youtube",
      label: "YouTube Optimized",
      description: "Perfect for YouTube uploads",
      preset: "youtube",
    },
    {
      id: "tiktok",
      label: "TikTok Optimized",
      description: "Optimized for TikTok",
      preset: "tiktok",
    },
    {
      id: "instagram",
      label: "Instagram Optimized",
      description: "Optimized for Instagram Reels",
      preset: "instagram",
    },
  ];

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      console.log("[v0] Initializing FFmpeg for export...");

      // Initialize FFmpeg
      await initFFmpeg();
      setProgress(10);

      console.log("[v0] Exporting with type:", exportType);

      let exportedBlob;

      if (exportType === "hq") {
        exportedBlob = await exportHighQuality(clip.videoBlob, (p) =>
          setProgress(10 + p * 0.8)
        );
      } else if (["youtube", "tiktok", "instagram"].includes(exportType)) {
        exportedBlob = await exportForSocialMedia(
          clip.videoBlob,
          exportType
        );
        setProgress(90);
      } else {
        // Standard export with effects
        exportedBlob = await applyEffectsAndExport(
          clip.videoBlob,
          clip.effects,
          (p) => setProgress(10 + p * 0.8)
        );
      }

      setProgress(95);

      // Create file info
      const fileSize = (exportedBlob.size / (1024 * 1024)).toFixed(2);
      setExportedFile({
        blob: exportedBlob,
        size: fileSize,
        type: exportType,
      });

      setProgress(100);
      console.log("[v0] Export complete. File size:", fileSize, "MB");
    } catch (err) {
      console.error("[v0] Export error:", err);
      setError(err.message || "Export failed. Please try again.");
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (exportedFile) {
      const filename = `${project?.name || "video"}-${new Date().getTime()}.mp4`;
      downloadVideo(exportedFile.blob, filename);
      onSuccess?.();
    }
  };

  if (exportedFile) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <h3 className="text-sm font-semibold">Export Successful</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-green-500/20">
              <Check className="w-6 h-6 text-green-400" />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold mb-1">Ready to Download</p>
              <p className="text-xs text-muted-foreground">
                File size: {exportedFile.size} MB
              </p>
              <p className="text-xs text-muted-foreground">
                Format: {exportType.toUpperCase()}
              </p>
            </div>

            <Button onClick={handleDownload} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Video
            </Button>

            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 p-4 flex items-center justify-between border-b border-border bg-card">
          <h2 className="text-sm font-semibold">Export Video</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Export Format
            </p>
            {exportOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setExportType(option.id)}
                disabled={loading}
                className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                  exportType === option.id
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-border bg-secondary/30 hover:border-border/80"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <p className="text-xs font-semibold">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Exporting...</p>
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Start Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
