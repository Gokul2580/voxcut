import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { RotateCcw, Maximize2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CropPanPanel({ 
  crop = { x: 0, y: 0, width: 1, height: 1 },
  panAnimation = null,
  onCropChange,
  onPanAnimationChange,
}) {
  const [cropMode, setCropMode] = useState('manual');
  const [panStartZoom, setPanStartZoom] = useState(1);
  const [panEndZoom, setPanEndZoom] = useState(1);

  const aspectRatios = {
    'full': { label: '16:9 (Full)', ratio: 16 / 9 },
    'square': { label: '1:1 (Square)', ratio: 1 },
    'portrait': { label: '9:16 (Portrait)', ratio: 9 / 16 },
    'cinema': { label: '2.39:1 (Cinema)', ratio: 2.39 },
    'tiktok': { label: '9:16 (TikTok)', ratio: 9 / 16 },
  };

  const handleReset = () => {
    onCropChange({ x: 0, y: 0, width: 1, height: 1 });
  };

  const applyAspectRatio = (ratioKey) => {
    const ratio = aspectRatios[ratioKey].ratio;
    const videoRatio = 16 / 9; // Assume 16:9 video
    
    let newCrop = { ...crop };
    
    if (ratio > videoRatio) {
      // Wider crop
      newCrop.height = 1;
      newCrop.width = ratio / videoRatio;
      newCrop.x = (1 - newCrop.width) / 2;
      newCrop.y = 0;
    } else {
      // Taller crop
      newCrop.width = 1;
      newCrop.height = videoRatio / ratio;
      newCrop.x = 0;
      newCrop.y = (1 - newCrop.height) / 2;
    }
    
    onCropChange(newCrop);
  };

  const createZoomPan = () => {
    const startCrop = {
      x: 0.5 - (0.5 / panStartZoom),
      y: 0.5 - (0.5 / panStartZoom),
      width: 1 / panStartZoom,
      height: 1 / panStartZoom,
    };
    
    const endCrop = {
      x: 0.5 - (0.5 / panEndZoom),
      y: 0.5 - (0.5 / panEndZoom),
      width: 1 / panEndZoom,
      height: 1 / panEndZoom,
    };
    
    onPanAnimationChange({
      startCrop,
      endCrop,
      duration: 5,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Crop & Pan</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          className="h-7"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant={cropMode === 'manual' ? 'default' : 'outline'}
          onClick={() => setCropMode('manual')}
          className="h-8 text-xs"
        >
          Manual Crop
        </Button>
        <Button
          size="sm"
          variant={cropMode === 'pan' ? 'default' : 'outline'}
          onClick={() => setCropMode('pan')}
          className="h-8 text-xs"
        >
          Zoom & Pan
        </Button>
      </div>

      {cropMode === 'manual' && (
        <div className="space-y-3">
          {/* Preset Aspect Ratios */}
          <div className="space-y-2">
            <p className="text-xs font-semibold">Aspect Ratio Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(aspectRatios).map(([key, { label }]) => (
                <Button
                  key={key}
                  size="sm"
                  variant="outline"
                  onClick={() => applyAspectRatio(key)}
                  className="h-7 text-xs whitespace-normal"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Crop Controls */}
          <div className="space-y-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
            <p className="text-xs font-semibold">Manual Adjustment</p>

            {/* Left */}
            <div className="space-y-1.5">
              <Label className="text-xs flex justify-between">
                <span>Left</span>
                <span className="text-muted-foreground">{Math.round(crop.x * 100)}%</span>
              </Label>
              <Slider
                value={[crop.x]}
                onValueChange={([v]) =>
                  onCropChange({
                    ...crop,
                    x: Math.min(v, 1 - crop.width),
                  })
                }
                min={0}
                max={1}
                step={0.02}
              />
            </div>

            {/* Top */}
            <div className="space-y-1.5">
              <Label className="text-xs flex justify-between">
                <span>Top</span>
                <span className="text-muted-foreground">{Math.round(crop.y * 100)}%</span>
              </Label>
              <Slider
                value={[crop.y]}
                onValueChange={([v]) =>
                  onCropChange({
                    ...crop,
                    y: Math.min(v, 1 - crop.height),
                  })
                }
                min={0}
                max={1}
                step={0.02}
              />
            </div>

            {/* Width */}
            <div className="space-y-1.5">
              <Label className="text-xs flex justify-between">
                <span>Width</span>
                <span className="text-muted-foreground">{Math.round(crop.width * 100)}%</span>
              </Label>
              <Slider
                value={[crop.width]}
                onValueChange={([v]) =>
                  onCropChange({
                    ...crop,
                    width: Math.min(v, 1 - crop.x),
                  })
                }
                min={0.1}
                max={1}
                step={0.02}
              />
            </div>

            {/* Height */}
            <div className="space-y-1.5">
              <Label className="text-xs flex justify-between">
                <span>Height</span>
                <span className="text-muted-foreground">{Math.round(crop.height * 100)}%</span>
              </Label>
              <Slider
                value={[crop.height]}
                onValueChange={([v]) =>
                  onCropChange({
                    ...crop,
                    height: Math.min(v, 1 - crop.y),
                  })
                }
                min={0.1}
                max={1}
                step={0.02}
              />
            </div>
          </div>
        </div>
      )}

      {cropMode === 'pan' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Create smooth zoom and pan animations
          </p>

          <div className="space-y-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
            {/* Start Zoom */}
            <div className="space-y-1.5">
              <Label className="text-xs flex justify-between">
                <span>Start Zoom Level</span>
                <span className="text-muted-foreground">{panStartZoom.toFixed(2)}x</span>
              </Label>
              <Slider
                value={[panStartZoom]}
                onValueChange={([v]) => setPanStartZoom(Math.max(1, v))}
                min={1}
                max={5}
                step={0.5}
              />
            </div>

            {/* End Zoom */}
            <div className="space-y-1.5">
              <Label className="text-xs flex justify-between">
                <span>End Zoom Level</span>
                <span className="text-muted-foreground">{panEndZoom.toFixed(2)}x</span>
              </Label>
              <Slider
                value={[panEndZoom]}
                onValueChange={([v]) => setPanEndZoom(Math.max(1, v))}
                min={1}
                max={5}
                step={0.5}
              />
            </div>

            <Button
              size="sm"
              onClick={createZoomPan}
              className="w-full h-7 text-xs"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              Apply Zoom & Pan
            </Button>
          </div>

          {panAnimation && (
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-muted-foreground">
              Zoom & pan animation created. Duration: {panAnimation.duration}s
            </div>
          )}
        </div>
      )}

      {/* Preview Info */}
      <div className="text-xs text-muted-foreground p-2 rounded-lg bg-secondary/30 border border-border/30">
        Crop changes are visible in real-time preview
      </div>
    </div>
  );
}
