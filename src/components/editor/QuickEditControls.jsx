import React from "react";
import { Button } from "@/components/ui/button";
import {
  Scissors,
  Copy,
  Trash2,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  ZoomIn,
  RotateCw,
  Crop
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function QuickEditControls({ clip, onAction }) {
  const handleTrim = (direction) => {
    onAction({
      type: "TRIM_CLIP",
      clipId: clip.id,
      trimStart: direction === "start" ? (clip.trimStart || 0) + 1 : clip.trimStart || 0,
      trimEnd: direction === "end" ? (clip.trimEnd || 0) + 1 : clip.trimEnd || 0
    });
  };

  const handleSplit = () => {
    onAction({
      type: "SPLIT_CLIP",
      clipId: clip.id,
      splitTime: ((clip.duration || 0) - (clip.trimStart || 0) - (clip.trimEnd || 0)) / 2
    });
  };

  const handleSpeed = (speed) => {
    onAction({
      type: "SET_SPEED",
      clipId: clip.id,
      speed
    });
  };

  const handleEffect = (effect) => {
    onAction({
      type: "ADD_EFFECT",
      clipId: clip.id,
      effect
    });
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 bg-background/95 border border-border/50 rounded-lg p-1 shadow-lg">
        {/* Trim Start */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => handleTrim("start")}
            >
              <Scissors className="w-3.5 h-3.5 rotate-180" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Trim Start (+1s)</TooltipContent>
        </Tooltip>

        {/* Trim End */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => handleTrim("end")}
            >
              <Scissors className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Trim End (+1s)</TooltipContent>
        </Tooltip>

        {/* Split */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={handleSplit}
            >
              <Scissors className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Split at Middle</TooltipContent>
        </Tooltip>

        {/* Duplicate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onAction({ type: "DUPLICATE_CLIP", clipId: clip.id })}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicate Clip</TooltipContent>
        </Tooltip>

        {/* Mute Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onAction({
                type: "TOGGLE_MUTE",
                clipId: clip.id,
                muted: !clip.muted
              })}
            >
              {clip.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{clip.muted ? "Unmute" : "Mute"}</TooltipContent>
        </Tooltip>

        {/* Speed Menu */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Gauge className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Adjust Speed</TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSpeed(0.5)}>0.5x (Slow Motion)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSpeed(0.75)}>0.75x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSpeed(1)}>1x (Normal)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSpeed(1.5)}>1.5x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSpeed(2)}>2x (Fast)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSpeed(3)}>3x (Very Fast)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Effects Menu */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Add Effects</TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuLabel>Video Effects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEffect({ type: "blur", intensity: 5 })}>
              Blur
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEffect({ type: "zoom", scale: 1.2 })}>
              <ZoomIn className="w-3 h-3 mr-2" />
              Zoom In
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEffect({ type: "rotate", degrees: 90 })}>
              <RotateCw className="w-3 h-3 mr-2" />
              Rotate 90°
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEffect({ type: "grayscale" })}>
              Grayscale
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEffect({ type: "brightness", value: 1.2 })}>
              Brighten
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEffect({ type: "contrast", value: 1.3 })}>
              High Contrast
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Crop */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onAction({
                type: "CROP_CLIP",
                clipId: clip.id,
                crop: { x: 0, y: 0, width: 80, height: 80 }
              })}
            >
              <Crop className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Crop to Center</TooltipContent>
        </Tooltip>

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => onAction({ type: "REMOVE_CLIP", clipId: clip.id })}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Clip</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}