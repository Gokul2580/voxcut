const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef, useEffect } from "react";

import { Film, Music, Image, Upload, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { inferMediaType, validateAssetForTrack } from "./timelineHelpers";

const MEDIA_ICONS = {
  video: Film,
  audio: Music,
  image: Image,
};

const MEDIA_COLORS = {
  video: "from-violet-500/20 to-blue-500/20",
  audio: "from-emerald-500/20 to-teal-500/20",
  image: "from-amber-500/20 to-orange-500/20",
};

const MEDIA_ICON_COLORS = {
  video: "text-violet-400",
  audio: "text-emerald-400",
  image: "text-amber-400",
};

function getAssetMediaType(asset) {
  if (asset.media_type) return asset.media_type;
  // Try MIME type, then filename extension
  const fromMime = inferMediaType(asset.file_type);
  if (fromMime !== "video") return fromMime;
  return inferMediaType(asset.name) || "video";
}

function AudioWaveform({ asset }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || asset.media_type !== "audio") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "rgba(16, 185, 129, 0.6)";
    ctx.clearRect(0, 0, width, height);

    // Generate simple waveform pattern
    const bars = 40;
    const barWidth = width / bars;
    for (let i = 0; i < bars; i++) {
      const randomHeight = Math.random() * height * 0.6 + height * 0.2;
      ctx.fillRect(i * barWidth + 1, height / 2 - randomHeight / 2, barWidth - 2, randomHeight);
    }
  }, [asset]);

  return <canvas ref={canvasRef} width={120} height={20} className="rounded" />;
}

export default function MediaLibrary({ assets, projectId, onAssetAdded, onAddToTimeline, onAssetDeleted }) {
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const MAX_SIZE_MB = 100;
    const oversized = files.filter(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length) {
      toast.error(`File too large. Max size is ${MAX_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of files) {
        const { file_url } = await db.integrations.Core.UploadFile({ file });
        // Use MIME type first; fall back to filename extension if MIME is generic/missing
        const mediaType = inferMediaType(file.type) !== "video"
          ? inferMediaType(file.type)
          : inferMediaType(file.name);
        const asset = await db.entities.MediaAsset.create({
          project_id: projectId,
          name: file.name,
          file_url,
          file_type: file.type,
          media_type: mediaType,
          duration: 0,
        });
        onAssetAdded(asset);
        uploaded++;
      }
      toast.success(`${uploaded} file(s) uploaded`);
    } catch (err) {
      toast.error(`Upload failed: ${err.message || "Network error."}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (asset) => {
    await db.entities.MediaAsset.delete(asset.id);
    onAssetDeleted(asset.id);
    toast.success("Asset removed");
  };

  const handleAddToTimeline = (asset) => {
    const mediaType = getAssetMediaType(asset);
    // Determine target track and validate
    const targetTrack = mediaType === "audio" ? "audio" : "video";
    const { valid, reason } = validateAssetForTrack(asset, targetTrack);
    if (!valid) {
      toast.error(reason);
      return;
    }
    onAddToTimeline(asset);
  };

  const videos = assets.filter(a => getAssetMediaType(a) === "video");
  const audios = assets.filter(a => getAssetMediaType(a) === "audio");
  const images = assets.filter(a => getAssetMediaType(a) === "image");

  const getFilteredAssets = () => {
    switch (filter) {
      case "video":
        return videos;
      case "audio":
        return audios;
      case "image":
        return images;
      default:
        return assets;
    }
  };

  const renderAsset = (asset) => {
    const mediaType = getAssetMediaType(asset);
    const Icon = MEDIA_ICONS[mediaType] || Film;
    const gradientColor = MEDIA_COLORS[mediaType] || MEDIA_COLORS.video;
    const iconColor = MEDIA_ICON_COLORS[mediaType] || MEDIA_ICON_COLORS.video;
    const label = mediaType === "audio"
      ? (asset.duration > 0 ? `${asset.duration.toFixed(1)}s` : "Audio")
      : mediaType === "image"
      ? "Image"
      : (asset.duration > 0 ? `${asset.duration.toFixed(1)}s` : "Video");

    const badgeLabel = mediaType === "audio" ? "AUDIO" : mediaType === "image" ? "IMAGE" : "VIDEO";
    const badgeColor = mediaType === "audio" ? "bg-emerald-500/20 text-emerald-300" : mediaType === "image" ? "bg-amber-500/20 text-amber-300" : "bg-violet-500/20 text-violet-300";

    return (
      <div
        key={asset.id}
        className="group relative rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 p-2.5 transition-colors"
      >
        <div className="flex items-start gap-2.5">
          <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-medium truncate flex-1">{asset.name}</p>
              <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${badgeColor}`}>
                {badgeLabel}
              </span>
            </div>
            {mediaType === "audio" ? (
              <AudioWaveform asset={asset} />
            ) : (
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            )}
          </div>
        </div>
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => handleAddToTimeline(asset)}
            className="w-6 h-6 rounded bg-primary/80 hover:bg-primary flex items-center justify-center"
            title="Add to timeline"
          >
            <Plus className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={() => handleDelete(asset)}
            className="w-6 h-6 rounded bg-destructive/80 hover:bg-destructive flex items-center justify-center"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    );
  };

  const hasAssets = assets.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Media</h3>
        <label className="cursor-pointer">
          <input type="file" accept="video/*,audio/*,image/*" multiple className="hidden" onChange={handleUpload} />
          <div className="w-7 h-7 rounded-md bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
        </label>
      </div>

      <div className="border-b border-border p-2 flex gap-1">
        <button
          onClick={() => setFilter("all")}
          className={`text-[10px] font-semibold px-2.5 py-1.5 rounded transition-colors ${
            filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("video")}
          className={`text-[10px] font-semibold px-2.5 py-1.5 rounded transition-colors ${
            filter === "video" ? "bg-violet-500/30 text-violet-300" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Video {videos.length > 0 && `(${videos.length})`}
        </button>
        <button
          onClick={() => setFilter("audio")}
          className={`text-[10px] font-semibold px-2.5 py-1.5 rounded transition-colors ${
            filter === "audio" ? "bg-emerald-500/30 text-emerald-300" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Audio {audios.length > 0 && `(${audios.length})`}
        </button>
        <button
          onClick={() => setFilter("image")}
          className={`text-[10px] font-semibold px-2.5 py-1.5 rounded transition-colors ${
            filter === "image" ? "bg-amber-500/30 text-amber-300" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Images {images.length > 0 && `(${images.length})`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {!hasAssets && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-4">
            <Film className="w-8 h-8 opacity-40" />
            <p className="text-xs text-center">Upload video, audio, or image files</p>
          </div>
        )}

        {getFilteredAssets().length === 0 && hasAssets && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-xs">No {filter === "all" ? "media" : filter} files</p>
          </div>
        )}

        {getFilteredAssets().map(renderAsset)}
      </div>
    </div>
  );
}