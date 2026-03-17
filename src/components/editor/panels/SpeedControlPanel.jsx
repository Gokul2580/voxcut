import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { RotateCcw, FastForward, Rewind } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SpeedControlPanel({ 
  speed = 1, 
  reverse = false,
  onSpeedChange,
  onReverseChange,
  duration = 10 
}) {
  const speedPresets = [
    { label: '0.25x (Super Slow)', value: 0.25 },
    { label: '0.5x (Slow Motion)', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '1x (Normal)', value: 1 },
    { label: '1.5x', value: 1.5 },
    { label: '2x (Fast Forward)', value: 2 },
    { label: '3x', value: 3 },
    { label: '4x (Super Speed)', value: 4 },
  ];

  const effectiveDuration = duration / speed;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Speed Control</h3>

      {/* Speed Slider */}
      <div className="space-y-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
        <div className="space-y-1.5">
          <Label className="text-xs flex justify-between">
            <span className="flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5" />
              Playback Speed
            </span>
            <span className="text-muted-foreground font-mono">{speed.toFixed(2)}x</span>
          </Label>
          <Slider
            value={[speed]}
            onValueChange={([v]) => onSpeedChange(v)}
            min={0.25}
            max={4}
            step={0.25}
          />
        </div>

        {/* Reverse Toggle */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReverseChange(!reverse)}
          className="w-full h-7 text-xs"
        >
          <Rewind className={`w-3 h-3 mr-1.5 ${reverse ? 'scale-x-[-1]' : ''}`} />
          {reverse ? 'Playing in Reverse' : 'Play Forward'}
        </Button>
      </div>

      {/* Speed Presets */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Quick Presets</p>
        <div className="grid grid-cols-2 gap-2">
          {speedPresets.map((preset) => (
            <Button
              key={preset.value}
              size="sm"
              variant={speed === preset.value ? 'default' : 'outline'}
              onClick={() => onSpeedChange(preset.value)}
              className="h-8 text-xs whitespace-normal"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Speed Input */}
      <div className="space-y-1.5">
        <Label className="text-xs">Custom Speed</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={speed}
            onChange={(e) => {
              const v = parseFloat(e.target.value) || 0.25;
              onSpeedChange(Math.max(0.25, Math.min(v, 4)));
            }}
            className="h-7 text-xs flex-1"
            placeholder="1.0"
            step={0.25}
            min={0.25}
            max={4}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSpeedChange(1)}
            className="h-7 px-2"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Duration Info */}
      <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Original Duration:</span>
          <span className="font-mono font-semibold">{duration.toFixed(1)}s</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Effective Duration:</span>
          <span className="font-mono font-semibold text-violet-400">{effectiveDuration.toFixed(1)}s</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Direction:</span>
          <span className="font-mono font-semibold">
            {reverse ? '← Reverse' : '→ Forward'}
          </span>
        </div>
      </div>

      {/* Effects Legend */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Speed Effects</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• <span className="text-yellow-600">0.25x - 0.75x:</span> Slow motion effect</p>
          <p>• <span className="text-cyan-600">1x:</span> Normal playback speed</p>
          <p>• <span className="text-orange-600">1.5x - 4x:</span> Fast forward effect</p>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground p-2 rounded-lg bg-secondary/30 border border-border/30">
        Speed changes affect the effective duration of the clip in your timeline
      </div>
    </div>
  );
}
