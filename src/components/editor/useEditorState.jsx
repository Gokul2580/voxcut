import { useState, useCallback } from "react";

/**
 * Centralized async state for the editor.
 * Exposes: isProcessingCommand, isRendering, isPlaying
 * and helpers to set each.
 */
export function useEditorState() {
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /** True when any exclusive async operation is running */
  const isBusy = isProcessingCommand || isRendering;

  const startCommand  = useCallback(() => setIsProcessingCommand(true),  []);
  const finishCommand = useCallback(() => setIsProcessingCommand(false), []);
  const startRender   = useCallback(() => setIsRendering(true),          []);
  const finishRender  = useCallback(() => setIsRendering(false),         []);
  const startPlay     = useCallback(() => setIsPlaying(true),            []);
  const stopPlay      = useCallback(() => setIsPlaying(false),           []);

  return {
    isProcessingCommand,
    isRendering,
    isPlaying,
    isBusy,
    startCommand,
    finishCommand,
    startRender,
    finishRender,
    startPlay,
    stopPlay,
  };
}