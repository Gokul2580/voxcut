import React, { useState } from "react";
import { Zap, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TRANSITIONS = [
  { value: "none",       label: "No transition",  icon: "—" },
  { value: "fade",       label: "Fade to black",  icon: "⬛" },
  { value: "crossfade",  label: "Crossfade",      icon: "⊞" },
  { value: "slide",      label: "Slide",          icon: "▶" },
];

export default function TransitionPicker({ clip, onSet }) {
  const current = clip?.transition?.type || "none";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Set transition before this clip"
          onClick={(e) => e.stopPropagation()}
          className={`
            absolute -left-3 top-1/2 -translate-y-1/2 z-20
            w-5 h-5 rounded-full border text-[10px] flex items-center justify-center
            shadow transition-all hover:scale-110
            ${current !== "none"
              ? "bg-pink-500 border-pink-400 text-white"
              : "bg-card border-border/60 text-muted-foreground hover:border-violet-500/60"}
          `}
        >
          {current === "none" ? "+" : "✦"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center" className="w-44">
        <div className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Transition
        </div>
        {TRANSITIONS.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={(e) => { e.stopPropagation(); onSet(clip.id, t.value); }}
            className={`gap-2 text-xs ${current === t.value ? "text-violet-400 font-semibold" : ""}`}
          >
            <span className="text-sm">{t.icon}</span>
            {t.label}
            {current === t.value && <span className="ml-auto text-violet-400">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}