import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Languages } from "lucide-react";
import { toast } from "sonner";

const VOICE_EXPLANATIONS = {
  english: {
    title: "VoxCut - AI Video Editor Explained",
    text: `Welcome to VoxCut, the world's first conversational AI-powered video editor. 

    Imagine editing videos just by talking. No complex software to learn. No confusing timelines. Just speak naturally.

    Here's how it works. Upload your raw footage - videos, images, or audio. Then simply tell VoxCut what you want. Say "Trim the first clip to 5 seconds" and it's done instantly. Say "Add captions" and AI generates them for you. Say "Remove all silences" and VoxCut automatically cleans your video.

    Our AI understands context. If you say "make it faster," VoxCut knows which clip you're talking about. It remembers your last edit and predicts what you want next.

    You can use voice commands or type in the chat. Either way, VoxCut edits in real-time while you watch. Professional timeline, drag-and-drop clips, multi-track editing - all controlled by your voice.

    The best part? You don't need any editing experience. From complete beginners to professional creators, VoxCut makes video editing 10 times faster.

    Upload. Speak. Export. That's it. Welcome to the future of video editing.`,
    voice: "en-US"
  },
  hindi: {
    title: "VoxCut - AI Video Editor समझाया",
    text: `VoxCut में आपका स्वागत है, दुनिया का पहला conversational AI-powered video editor.

    सोचिए कि सिर्फ बोलकर videos edit करना। कोई complex software सीखने की जरूरत नहीं। कोई confusing timelines नहीं। बस naturally बोलिए।

    ये कैसे काम करता है? अपनी raw footage upload करें - videos, images, या audio। फिर बस VoxCut को बताएं कि आप क्या चाहते हैं। कहें "पहली clip को 5 seconds में trim करें" और तुरंत हो जाता है। कहें "captions जोड़ें" और AI आपके लिए बना देता है। कहें "सभी silences हटाएं" और VoxCut automatically आपकी video clean कर देता है।

    हमारा AI context समझता है। अगर आप कहें "इसे fast करें," तो VoxCut जानता है कि आप किस clip के बारे में बात कर रहे हैं। ये आपकी last edit याद रखता है और predict करता है कि आप आगे क्या चाहते हैं।

    आप voice commands या chat में type कर सकते हैं। दोनों तरीकों से, VoxCut real-time में edit करता है जब आप देख रहे होते हैं। Professional timeline, drag-and-drop clips, multi-track editing - सब कुछ आपकी voice से control होता है।

    सबसे अच्छी बात? आपको editing का कोई experience नहीं चाहिए। Complete beginners से लेकर professional creators तक, VoxCut video editing को 10 गुना fast बना देता है।

    Upload करें। बोलें। Export करें। बस इतना ही। Video editing के future में आपका स्वागत है।`,
    voice: "hi-IN"
  }
};

export default function VoiceAgentDialog({ open, onOpenChange }) {
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState(null);

  const handlePlay = () => {
    // Stop any ongoing speech
    if (isPlaying && currentUtterance) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentUtterance(null);
      return;
    }

    const explanation = VOICE_EXPLANATIONS[selectedLanguage];
    
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      toast.error("Voice feature not supported in this browser");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(explanation.text);
    utterance.lang = explanation.voice;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      toast.success(`Playing in ${selectedLanguage === "english" ? "English" : "Hindi"}`);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentUtterance(null);
    };

    utterance.onerror = (event) => {
      setIsPlaying(false);
      setCurrentUtterance(null);
      toast.error("Voice playback error");
      console.error("Speech synthesis error:", event);
    };

    setCurrentUtterance(utterance);
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentUtterance(null);
  };

  const handleClose = () => {
    handleStop();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-[#0A0D16] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            {VOICE_EXPLANATIONS[selectedLanguage].title}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Let our AI voice agent explain VoxCut's features and capabilities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Selector */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                handleStop();
                setSelectedLanguage("english");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                selectedLanguage === "english"
                  ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Languages className="w-4 h-4" />
              English
            </button>
            <button
              onClick={() => {
                handleStop();
                setSelectedLanguage("hindi");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                selectedLanguage === "hindi"
                  ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Languages className="w-4 h-4" />
              हिंदी (Hindi)
            </button>
          </div>

          {/* Text Content */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-h-80 overflow-y-auto">
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
              {VOICE_EXPLANATIONS[selectedLanguage].text}
            </p>
          </div>

          {/* Play/Stop Button */}
          <div className="flex justify-center">
            <Button
              onClick={isPlaying ? handleStop : handlePlay}
              size="lg"
              className={`px-8 py-6 text-base ${
                isPlaying
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 shadow-lg shadow-violet-500/30"
              }`}
            >
              {isPlaying ? (
                <>
                  <VolumeX className="w-5 h-5 mr-2" />
                  Stop Voice
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 mr-2" />
                  Listen to Explanation
                </>
              )}
            </Button>
          </div>

          {isPlaying && (
            <div className="flex items-center justify-center gap-2 text-violet-400 text-sm">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-4 bg-violet-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              Playing voice explanation...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}