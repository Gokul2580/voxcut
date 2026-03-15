import React, { useState, useRef, useEffect } from "react";
import { Blend } from "lucide-react";

const TRANSITIONS = [
  { value: null,        label: "Cut",        desc: "Instant cut" },
  { value: "fade",      label: "Fade",       desc: "Dip to black" },
  { value: "crossfade", label: "Crossfade",  desc: "Blend between clips" },
  { value: "slide",     label: "Slide",      desc: "Slide left" },
];

const TYPE_COLORS = {
  fade:       "bg-violet-500/20 text-violet-300 border-violet-500/40 hover:bg-violet-500/30",
  crossfade:  "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30",
  slide:      "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30",
};

export default function TransitionBadge({ clip, onSetTransition, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const type = clip?.transition?.type || null;
  const colorClass = type ? TYPE_COLORS[type] : "bg-secondary/60 text-muted-foreground border-border/50 hover:bg-secondary";

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pick = (value) => {
    setOpen(false);
    onSetTransition(clip.id, value);
  };

  return (
    <div ref={ref} className="relative" style={style}>
      <button
        title={type ? `Transition: ${type}` : "Add transition"}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider transition-colors ${colorClass}`}
      >
        <Blend className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="hidden sm:inline">{type || "cut"}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-32">
          <div className="px-2 py-1.5 text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border/50 font-semibold">
            Transition
          </div>
          {TRANSITIONS.map((t) => (
            <button
              key={String(t.value)}
              onClick={() => pick(t.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-secondary transition-colors ${
                type === t.value ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              <span className="font-medium w-16">{t.label}</span>
              <span className="text-muted-foreground text-[10px]">{t.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}