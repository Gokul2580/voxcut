import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function KeyframePanel({ keyframes = {}, duration = 10, onUpdate }) {
  const [activeTrack, setActiveTrack] = useState('position');
  const [selectedKeyframeIdx, setSelectedKeyframeIdx] = useState(null);

  const tracks = {
    position: { label: 'Position', props: ['x', 'y'] },
    scale: { label: 'Scale', props: ['scaleX', 'scaleY'] },
    rotation: { label: 'Rotation', props: ['rotation'] },
    opacity: { label: 'Opacity', props: ['opacity'] },
  };

  const currentTrackKeyframes = keyframes[activeTrack] || [];
  const selectedKf =
    selectedKeyframeIdx !== null ? currentTrackKeyframes[selectedKeyframeIdx] : null;

  const addKeyframe = (time) => {
    const newKeyframes = [...currentTrackKeyframes];
    const defaultValues = {
      position: { x: 0.5, y: 0.5 },
      scale: { scaleX: 1, scaleY: 1 },
      rotation: { rotation: 0 },
      opacity: { opacity: 1 },
    };

    const newKf = {
      time,
      ...(defaultValues[activeTrack] || {}),
    };

    newKeyframes.push(newKf);
    newKeyframes.sort((a, b) => a.time - b.time);

    onUpdate({
      ...keyframes,
      [activeTrack]: newKeyframes,
    });

    setSelectedKeyframeIdx(newKeyframes.length - 1);
  };

  const updateKeyframe = (updates) => {
    if (selectedKeyframeIdx === null) return;
    const newKeyframes = [...currentTrackKeyframes];
    newKeyframes[selectedKeyframeIdx] = {
      ...newKeyframes[selectedKeyframeIdx],
      ...updates,
    };
    onUpdate({
      ...keyframes,
      [activeTrack]: newKeyframes,
    });
  };

  const deleteKeyframe = (idx) => {
    const newKeyframes = currentTrackKeyframes.filter((_, i) => i !== idx);
    onUpdate({
      ...keyframes,
      [activeTrack]: newKeyframes,
    });
    if (selectedKeyframeIdx === idx) {
      setSelectedKeyframeIdx(null);
    }
  };

  const getValueLabel = (prop, value) => {
    switch (prop) {
      case 'rotation':
        return `${value}°`;
      case 'opacity':
        return `${Math.round(value * 100)}%`;
      case 'scaleX':
      case 'scaleY':
        return `${value.toFixed(2)}x`;
      default:
        return value.toFixed(2);
    }
  };

  const getValueRange = (prop) => {
    switch (prop) {
      case 'rotation':
        return { min: -360, max: 360, step: 10 };
      case 'opacity':
        return { min: 0, max: 1, step: 0.1 };
      case 'scaleX':
      case 'scaleY':
        return { min: 0.1, max: 3, step: 0.1 };
      default:
        return { min: 0, max: 1, step: 0.05 };
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Keyframe Animation</h3>

      {/* Track Selection */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(tracks).map(([key, track]) => (
          <Button
            key={key}
            size="sm"
            variant={activeTrack === key ? 'default' : 'outline'}
            onClick={() => {
              setActiveTrack(key);
              setSelectedKeyframeIdx(null);
            }}
            className="h-8 text-xs"
          >
            {track.label}
          </Button>
        ))}
      </div>

      {/* Add Keyframe */}
      <div className="space-y-1.5">
        <Label className="text-xs">Add Keyframe at (seconds)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="0"
            className="h-7 text-xs flex-1"
            id="kf-time"
            min={0}
            max={duration}
            step={0.1}
          />
          <Button
            size="sm"
            onClick={() => {
              const input = document.getElementById('kf-time');
              const time = parseFloat(input.value) || 0;
              addKeyframe(time);
              input.value = '';
            }}
            className="h-7 px-3"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Keyframes List */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Keyframes</p>
        {currentTrackKeyframes.length === 0 ? (
          <div className="text-xs text-muted-foreground p-2 rounded-lg bg-secondary/30 border border-border/30">
            No keyframes yet. Add one to start animating.
          </div>
        ) : (
          <div className="space-y-2">
            {currentTrackKeyframes.map((kf, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  selectedKeyframeIdx === idx
                    ? 'bg-cyan-500/20 border-cyan-500/50'
                    : 'bg-secondary/50 border-border/50 hover:border-border'
                }`}
                onClick={() => setSelectedKeyframeIdx(idx)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono">{kf.time.toFixed(2)}s</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteKeyframe(idx);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {selectedKeyframeIdx === idx && (
                  <div className="mt-2 space-y-2 border-t border-border/50 pt-2">
                    {tracks[activeTrack].props.map((prop) => {
                      const range = getValueRange(prop);
                      return (
                        <div key={prop} className="space-y-1.5">
                          <Label className="text-xs flex justify-between capitalize">
                            <span>{prop.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-muted-foreground">
                              {getValueLabel(prop, kf[prop] ?? 0)}
                            </span>
                          </Label>
                          <Slider
                            value={[kf[prop] ?? 0]}
                            onValueChange={([v]) =>
                              updateKeyframe({ [prop]: v })
                            }
                            min={range.min}
                            max={range.max}
                            step={range.step}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground p-2 rounded-lg bg-secondary/30 border border-border/30">
        Create smooth animations by setting keyframes at different times
      </div>
    </div>
  );
}
