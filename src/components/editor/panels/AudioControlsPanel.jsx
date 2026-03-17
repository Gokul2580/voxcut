import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AudioControlsPanel({ 
  volume = 1, 
  muted = false,
  audioFade = [],
  onVolumeChange,
  onMutedChange,
  onAudioFadeChange,
}) {
  const [selectedFadeIdx, setSelectedFadeIdx] = useState(null);

  const addFadeKeyframe = (type) => {
    const newFade = [...audioFade];
    
    if (type === 'fadeIn') {
      newFade.push({ time: 0, volume: 0 });
      newFade.push({ time: 1, volume: 1 });
    } else if (type === 'fadeOut') {
      newFade.push({ time: 0, volume: 1 });
      newFade.push({ time: 1, volume: 0 });
    }
    
    newFade.sort((a, b) => a.time - b.time);
    onAudioFadeChange(newFade);
  };

  const updateFadeKeyframe = (idx, updates) => {
    const newFade = [...audioFade];
    newFade[idx] = { ...newFade[idx], ...updates };
    onAudioFadeChange(newFade);
  };

  const removeFadeKeyframe = (idx) => {
    const newFade = audioFade.filter((_, i) => i !== idx);
    onAudioFadeChange(newFade);
  };

  const audioEffects = [
    { id: 'none', label: 'None' },
    { id: 'boost', label: 'Boost (+50%)' },
    { id: 'quiet', label: 'Quiet (-30%)' },
    { id: 'normalize', label: 'Normalize' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Audio Controls</h3>

      {/* Master Volume */}
      <div className="space-y-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
        <div className="space-y-1.5">
          <Label className="text-xs flex justify-between">
            <span>Master Volume</span>
            <span className="text-muted-foreground">{Math.round(volume * 100)}%</span>
          </Label>
          <Slider
            value={[volume]}
            onValueChange={([v]) => onVolumeChange(v)}
            min={0}
            max={1}
            step={0.05}
            disabled={muted}
            className="opacity-50 disabled:opacity-50"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onMutedChange(!muted)}
          className="w-full h-7 text-xs"
        >
          {muted ? '🔇 Unmute' : '🔊 Mute'}
        </Button>
      </div>

      {/* Audio Effects */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Quick Effects</p>
        <div className="grid grid-cols-2 gap-2">
          {audioEffects.map((effect) => (
            <Button
              key={effect.id}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                if (effect.id === 'boost') {
                  onVolumeChange(Math.min(volume * 1.5, 1));
                } else if (effect.id === 'quiet') {
                  onVolumeChange(volume * 0.7);
                } else if (effect.id === 'normalize') {
                  onVolumeChange(1);
                }
              }}
            >
              {effect.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Fade Keyframes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">Fade Keyframes</p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addFadeKeyframe('fadeIn')}
              className="h-6 px-2 text-xs"
            >
              Fade In
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addFadeKeyframe('fadeOut')}
              className="h-6 px-2 text-xs"
            >
              Fade Out
            </Button>
          </div>
        </div>

        {audioFade.length === 0 ? (
          <div className="text-xs text-muted-foreground p-2 rounded-lg bg-secondary/30 border border-border/30">
            No fade keyframes yet
          </div>
        ) : (
          <div className="space-y-2">
            {audioFade.map((keyframe, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  selectedFadeIdx === idx
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-secondary/50 border-border/50 hover:border-border'
                }`}
                onClick={() => setSelectedFadeIdx(idx)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {keyframe.time.toFixed(2)}s - {(keyframe.volume * 100).toFixed(0)}%
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFadeKeyframe(idx);
                      setSelectedFadeIdx(null);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {selectedFadeIdx === idx && (
                  <div className="mt-2 space-y-2 border-t border-border/50 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Time (s)</Label>
                      <Input
                        type="number"
                        value={keyframe.time}
                        onChange={(e) =>
                          updateFadeKeyframe(idx, {
                            time: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-6 text-xs"
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex justify-between">
                        <span>Volume</span>
                        <span className="text-muted-foreground">
                          {Math.round(keyframe.volume * 100)}%
                        </span>
                      </Label>
                      <Slider
                        value={[keyframe.volume]}
                        onValueChange={([v]) =>
                          updateFadeKeyframe(idx, { volume: v })
                        }
                        min={0}
                        max={1}
                        step={0.1}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground p-2 rounded-lg bg-secondary/30 border border-border/30">
        Use fade keyframes to create smooth audio transitions
      </div>
    </div>
  );
}
