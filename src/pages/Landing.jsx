const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clapperboard, Mic, Zap, Layers, Download, ArrowRight, Play, Sparkles, ChevronRight, Star, Volume2, Scissors, Type } from "lucide-react";

import VoiceAgentDialog from "@/components/landing/VoiceAgentDialog";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice Commands",
    description: "Just speak naturally. \"Trim the first clip to 5 seconds\" — done instantly.",
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
  },
  {
    icon: Zap,
    title: "AI-Powered Editing",
    description: "Our AI understands context. Describe your vision and watch the timeline update in real-time.",
    color: "from-blue-500 to-cyan-600",
    glow: "shadow-blue-500/20",
  },
  {
    icon: Layers,
    title: "Multi-Track Timeline",
    description: "Professional drag-and-drop timeline with clips, text overlays, transitions, and audio control.",
    color: "from-pink-500 to-rose-600",
    glow: "shadow-pink-500/20",
  },
  {
    icon: Download,
    title: "Instant Export",
    description: "Render and download your finished video in seconds. Share anywhere.",
    color: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
  },
];

const COMMANDS = [
  "Trim the first clip to 5 seconds",
  "Add a fade transition between clips",
  "Mute the background audio",
  "Add title text at the beginning",
  "Speed up clip 2 by 1.5x",
  "Duplicate the intro clip",
  "Remove the last clip",
  "Split clip 1 at 3 seconds",
];

function AnimatedCommand() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const command = COMMANDS[currentIndex];
    let timeout;

    if (!isDeleting && displayText.length < command.length) {
      timeout = setTimeout(() => setDisplayText(command.slice(0, displayText.length + 1)), 40);
    } else if (!isDeleting && displayText.length === command.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText.length > 0) {
      timeout = setTimeout(() => setDisplayText(displayText.slice(0, -1)), 20);
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % COMMANDS.length);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 backdrop-blur-sm max-w-md w-full">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0">
        <Mic className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm text-white/90 font-mono">
        {displayText}
        <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
      </span>
    </div>
  );
}

function FloatingOrb({ className }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`} />
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    const project = await db.entities.Project.create({
      name: "Demo Project",
      description: "A sample project to explore VOXCUT",
      status: "editing",
    });
    await db.entities.Timeline.create({
      project_id: project.id,
      timeline_json: { tracks: [], clips: [], texts: [], settings: { aspectRatio: "16:9", resolution: "1920x1080", fps: 30 } },
    });
    setDemoLoading(false);
    navigate(`/Editor?projectId=${project.id}`);
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-white overflow-hidden">
      {/* Background orbs */}
      <FloatingOrb className="w-[600px] h-[600px] bg-violet-600 top-[-200px] left-[-200px]" />
      <FloatingOrb className="w-[500px] h-[500px] bg-blue-600 top-[100px] right-[-150px]" />
      <FloatingOrb className="w-[400px] h-[400px] bg-pink-600 bottom-[0px] left-[30%]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">VOXCUT</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/Dashboard"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            My Projects
          </Link>
          <Link
            to="/Dashboard"
            className="text-sm px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-all"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 lg:pt-28">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Video Editing
          <ChevronRight className="w-3 h-3 opacity-60" />
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.9] mb-6 max-w-3xl">
          <span className="text-white">Talk.</span>{" "}
          <span className="text-white">Edit.</span>{" "}
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Done.</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/50 max-w-xl mb-10 leading-relaxed">
          The world's first conversational video editor. Upload your footage, speak your commands, and let AI do the rest.
        </p>

        {/* Animated command */}
        <div className="mb-10 flex justify-center w-full">
          <AnimatedCommand />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/Dashboard"
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 text-white font-semibold text-sm shadow-2xl shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
          >
            Start Editing Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={handleTryDemo}
            disabled={demoLoading}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-medium text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {demoLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating demo...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Try Demo
              </>
            )}
          </button>
        </div>

        {/* Social proof */}
        <div className="mt-10 flex items-center gap-2 text-xs text-white/30">
          <div className="flex -space-x-1.5">
            {["bg-violet-400", "bg-blue-400", "bg-pink-400", "bg-amber-400"].map((c, i) => (
              <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-[#080B14]`} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
          </div>
          <span>Loved by 10,000+ creators</span>
        </div>
      </section>

      {/* Editor Preview */}
      <section className="relative z-10 px-6 lg:px-12 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/3 backdrop-blur-sm shadow-2xl shadow-black/50">
            {/* Fake window bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 flex justify-center">
                <div className="px-8 py-1 rounded-md bg-white/5 text-xs text-white/30 font-mono">
                  voxcut.app/editor
                </div>
              </div>
            </div>
            {/* Editor mockup */}
            <div className="flex h-48 sm:h-72">
              {/* Left panel */}
              <div className="w-36 sm:w-48 bg-white/3 border-r border-white/5 p-3 flex flex-col gap-2">
                <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Media Library</div>
                {[80, 65, 72].map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-white/10 to-white/5 flex-shrink-0" />
                    <div className={`h-2 rounded-full bg-white/10`} style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
              {/* Center */}
              <div className="flex-1 bg-black/30 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-24 h-16 sm:w-40 sm:h-28 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center">
                    <Play className="w-8 h-8 text-violet-400/60" />
                  </div>
                </div>
                {/* Timeline strip */}
                <div className="h-14 border-t border-white/5 p-2 flex gap-1 items-center">
                  {[40, 55, 30, 65, 45, 35].map((w, i) => (
                    <div
                      key={i}
                      className={`h-8 rounded flex-shrink-0 ${i === 0 ? "bg-violet-500/40 border border-violet-500/30" : "bg-white/10"}`}
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
              </div>
              {/* Right chat panel */}
              <div className="w-36 sm:w-52 bg-white/3 border-l border-white/5 p-3 flex flex-col gap-2">
                <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">AI Assistant</div>
                <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 p-2 text-[10px] text-violet-300">
                  Hi! Describe what you want to edit...
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-[10px] text-white/60 self-end">
                  Trim first clip to 5s
                </div>
                <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 p-2 text-[10px] text-violet-300">
                  ✅ Done! Trimmed to 5 seconds.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 lg:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Everything you need to edit{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                faster
              </span>
            </h2>
            <p className="text-white/40 text-base">No learning curve. No timeline confusion. Just results.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, description, color, glow }) => (
              <div
                key={title}
                className={`p-5 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm hover:bg-white/6 transition-all group hover:-translate-y-0.5`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg ${glow} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice Agent Section */}
      <section className="relative z-10 px-6 lg:px-12 py-16 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-blue-500/10 backdrop-blur-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 mb-6 shadow-lg shadow-violet-500/30">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Understand Our Product?
            </h2>
            <p className="text-white/60 text-base mb-6 max-w-xl mx-auto">
              Let our AI voice agent explain VoxCut's features and how it revolutionizes video editing.
              Available in English and Hindi!
            </p>
            <button
              onClick={() => setVoiceDialogOpen(true)}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 text-white font-semibold text-sm shadow-2xl shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Volume2 className="w-5 h-5" />
              Listen to Voice Explanation
              <Sparkles className="w-4 h-4" />
            </button>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                English Available
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                हिंदी उपलब्ध (Hindi)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 lg:px-12 py-16 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-12">
            Three steps to your{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              perfect video
            </span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Upload", desc: "Drop in your footage. Any format.", icon: Download },
              { num: "02", title: "Command", desc: "Type or speak your edits naturally.", icon: Mic },
              { num: "03", title: "Export", desc: "Download your finished video instantly.", icon: Zap },
            ].map(({ num, title, desc, icon: Icon }) => (
              <div key={num} className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[9px] font-bold text-white">
                    {num.slice(-1)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-xs text-white/40">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 lg:px-12 py-20 text-center border-t border-white/5">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-black tracking-tight mb-4">
            Ready to edit smarter?
          </h2>
          <p className="text-white/40 mb-8">
            Join thousands of creators who edit 10x faster with VOXCUT.
          </p>
          <Link
            to="/Dashboard"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 text-white font-bold text-base shadow-2xl shadow-violet-500/30 transition-all hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative z-10 px-6 lg:px-12 py-16 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Built by{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Build n Brew
            </span>
          </h2>
          <p className="text-white/40 text-sm mb-10">Meet the team behind VOXCUT</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            {/* Team Leader */}
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                <Star className="w-7 h-7 text-white fill-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">Gokul BA</h3>
                <p className="text-xs text-violet-400">Team Leader</p>
              </div>
            </div>

            {/* Members */}
            <div className="flex flex-col gap-4">
              {[
                { name: "Nithish C", role: "Developer" },
                { name: "Nandhakishore K", role: "Developer" },
              ].map((member) => (
                <div key={member.name} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-violet-300">{member.name.charAt(0)}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">{member.name}</h3>
                    <p className="text-xs text-white/40">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-6 border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Clapperboard className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold">VOXCUT</span>
          </div>
          <p className="text-xs text-white/20">© 2026 Build n Brew. Talk. Edit. Done.</p>
        </div>
      </footer>

      {/* Voice Agent Dialog */}
      <VoiceAgentDialog open={voiceDialogOpen} onOpenChange={setVoiceDialogOpen} />
    </div>
  );
}