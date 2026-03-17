import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { colorGradePresets } from '@/utils/effectsUtils';
import { RotateCcw } from 'lucide-react';

export default function EffectsPanel({ effects = {}, onUpdate }) {
  const defaultEffects = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    opacity: 100,
  };

  const currentEffects = { ...defaultEffects, ...effects };

  const handleReset = () => {
    onUpdate(defaultEffects);
  };

  const applyPreset = (presetKey) => {
    onUpdate(colorGradePresets[presetKey]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Effects & Filters</h3>
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

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Presets</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(colorGradePresets).map((presetKey) => (
            <Button
              key={presetKey}
              size="sm"
              variant={
                JSON.stringify(currentEffects) ===
                JSON.stringify(colorGradePresets[presetKey])
                  ? 'default'
                  : 'outline'
              }
              onClick={() => applyPreset(presetKey)}
              className="h-8 text-xs capitalize"
            >
              {presetKey}
            </Button>
          ))}
        </div>
      </div>

      {/* Manual Controls */}
      <div className="space-y-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
        <p className="text-xs font-semibold">Color Grading</p>

        {/* Brightness */}
        <div className="space-y-1.5">
          <Label className="text-xs flex justify-between">
            <span>Brightness</span>
            <span className="text-muted-foreground">{currentEffects.brightness}%</span>
          </Label>
          <Slider
            value={[currentEffects.brightness]}
            onValueChange={([v]) => onUpdate({ ...effects, brightness: v })}
            min={0}
            max={200}
            step={5}
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1.5">
          <Label className="text-xs flex justify-between">
            <span>Contrast</span>
            <span className="text-muted-foreground">{currentEffects.contrast}%</span>
          </Label>
          <Slider
            value={[currentEffects.contrast]}
            onValueChange={([v]) => onUpdate({ ...effects, contrast: v })}
            min={0}
            max={200}
            step={5}
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1.5">
          <Label className="text-xs flex justify-between">
            <span>Saturation</span>
            <span className="text-muted-foreground">{currentEffects.saturation}%</span>
          </Label>
          <Slider
            value={[currentEffects.saturation]}
            onValueChange={([v]) => onUpdate({ ...effects, saturation: v })}
            min={0}
            max={200}
            step={5}
          />
        </div>

        {/* Hue */}
        <div className="space-y-1.5">
          <Label className="text-xs flex justify-between">
            <span>Hue Shift</span>
            <span className="text-muted-foreground">{currentEffects.hue}°</span>
          </Label>
          <Slider
            value={[currentEffects.hue]}
            onValueChange={([v]) => onUpdate({ ...effects, hue: v })}
            min={-180}
            max={180}
            step={5}
          />
        </div>

        {/* Blur */}
        <div className="space-y-1.5">
          <Label className="text-xs flex justify-between">
            <span>Blur</span>
            <span className="text-muted-foreground">{currentEffects.blur}px</span>
          </Label>
          <Slider
            value={[currentEffects.blur]}
            onValueChange={([v]) => onUpdate({ ...effects, blur: v })}
            min={0}
            max={20}
            step={1}
          />
        </div>

        {/* Opacity */}
        <div className="space-y-1.5">
          <Label className="text-xs flex justify-between">
            <span>Opacity</span>
            <span className="text-muted-foreground">{currentEffects.opacity}%</span>
          </Label>
          <Slider
            value={[currentEffects.opacity]}
            onValueChange={([v]) => onUpdate({ ...effects, opacity: v })}
            min={0}
            max={100}
            step={5}
          />
        </div>
      </div>

      {/* Live Preview Info */}
      <div className="text-xs text-muted-foreground p-2 rounded-lg bg-secondary/30 border border-border/30">
        Effects are applied in real-time to the preview
      </div>
    </div>
  );
}
