import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TextCaptionsPanel({ texts = [], onUpdate }) {
  const [selectedTextIdx, setSelectedTextIdx] = useState(null);
  const selectedText = selectedTextIdx !== null ? texts[selectedTextIdx] : null;

  const addText = () => {
    const newText = {
      id: Date.now(),
      content: 'New Text',
      startTime: 0,
      endTime: 5,
      fontSize: 32,
      color: '#ffffff',
      fontFamily: 'Arial',
      position: 'center',
      opacity: 1,
      x: 0.5,
      y: 0.5,
    };
    onUpdate([...texts, newText]);
    setSelectedTextIdx(texts.length);
  };

  const updateText = (updates) => {
    if (selectedTextIdx === null) return;
    const newTexts = [...texts];
    newTexts[selectedTextIdx] = { ...newTexts[selectedTextIdx], ...updates };
    onUpdate(newTexts);
  };

  const deleteText = (idx) => {
    const newTexts = texts.filter((_, i) => i !== idx);
    onUpdate(newTexts);
    if (selectedTextIdx === idx) {
      setSelectedTextIdx(null);
    }
  };

  const positions = {
    'top-left': 'Top Left',
    'top-center': 'Top Center',
    'top-right': 'Top Right',
    'center-left': 'Center Left',
    'center': 'Center',
    'center-right': 'Center Right',
    'bottom-left': 'Bottom Left',
    'bottom-center': 'Bottom Center',
    'bottom-right': 'Bottom Right',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Text & Captions</h3>
        <Button size="sm" onClick={addText} className="h-7">
          <Plus className="w-3 h-3 mr-1" />
          Add Text
        </Button>
      </div>

      {texts.length === 0 ? (
        <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground">No text elements yet</p>
        </div>
      ) : (
        <>
          {/* Text List */}
          <div className="space-y-2">
            {texts.map((text, idx) => (
              <div
                key={text.id}
                className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedTextIdx === idx
                    ? 'bg-violet-500/20 border-violet-500/50'
                    : 'bg-secondary/50 border-border/50 hover:border-border'
                }`}
                onClick={() => setSelectedTextIdx(idx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate">{text.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {text.startTime}s - {text.endTime}s
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteText(idx);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Text Properties */}
          {selectedText && (
            <div className="space-y-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <h4 className="text-xs font-semibold">Text Properties</h4>

              {/* Content */}
              <div className="space-y-1.5">
                <Label className="text-xs">Content</Label>
                <Input
                  value={selectedText.content}
                  onChange={(e) => updateText({ content: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="Enter text..."
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start (s)</Label>
                  <Input
                    type="number"
                    value={selectedText.startTime}
                    onChange={(e) =>
                      updateText({ startTime: parseFloat(e.target.value) || 0 })
                    }
                    className="h-7 text-xs"
                    step={0.1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End (s)</Label>
                  <Input
                    type="number"
                    value={selectedText.endTime}
                    onChange={(e) =>
                      updateText({ endTime: parseFloat(e.target.value) || 5 })
                    }
                    className="h-7 text-xs"
                    step={0.1}
                  />
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <Label className="text-xs flex justify-between">
                  <span>Font Size</span>
                  <span className="text-muted-foreground">{selectedText.fontSize}px</span>
                </Label>
                <Slider
                  value={[selectedText.fontSize]}
                  onValueChange={([v]) => updateText({ fontSize: v })}
                  min={12}
                  max={120}
                  step={4}
                />
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <Label className="text-xs">Font</Label>
                <Select
                  value={selectedText.fontFamily}
                  onValueChange={(v) => updateText({ fontFamily: v })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <Label className="text-xs">Position</Label>
                <Select
                  value={selectedText.position}
                  onValueChange={(v) => updateText({ position: v })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(positions).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedText.color}
                    onChange={(e) => updateText({ color: e.target.value })}
                    className="h-7 w-12 p-0"
                  />
                  <Input
                    type="text"
                    value={selectedText.color}
                    onChange={(e) => updateText({ color: e.target.value })}
                    className="h-7 flex-1 text-xs"
                  />
                </div>
              </div>

              {/* Opacity */}
              <div className="space-y-1.5">
                <Label className="text-xs flex justify-between">
                  <span>Opacity</span>
                  <span className="text-muted-foreground">{Math.round(selectedText.opacity * 100)}%</span>
                </Label>
                <Slider
                  value={[selectedText.opacity]}
                  onValueChange={([v]) => updateText({ opacity: v })}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
