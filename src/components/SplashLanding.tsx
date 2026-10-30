import React, { useState } from 'react';
import {
  Clapperboard,
  Play,
  Mic,
  FileText,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { PWAInstallButton, OfflineIndicator } from './PWAInstallButton';

interface SplashLandingProps {
  onStartNewScene: () => void;
  onEnterExistingStudio: () => void;
  castCount: number;
  sceneCount: number;
}

export const SplashLanding: React.FC<SplashLandingProps> = ({
  onStartNewScene,
  onEnterExistingStudio,
  castCount,
  sceneCount
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      <OfflineIndicator />
      {/* Subtle Ambient Studio Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full bg-cyan-500/10 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-1/4 w-[480px] h-[480px] rounded-full bg-amber-500/10 blur-[130px]"
      />

      {/* Top Minimal Brand Header */}
      <header className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 py-5 flex items-center justify-between gap-6 border-b border-slate-800/70 relative z-10">
        <div className="flex items-center gap-3 shrink-0">
          {/* Branded Clapperboard Icon */}
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/50 flex items-center justify-center shadow-inner">
            <Clapperboard className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="font-display font-extrabold tracking-tight text-lg sm:text-xl text-white whitespace-nowrap">
            <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-amber-400 bg-clip-text text-transparent">
              STORYCAST
            </span>{' '}
            <span className="text-amber-400">AI</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onEnterExistingStudio}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-2 transition whitespace-nowrap shrink-0"
        >
          <span>Open Active Workspace</span>
          <ArrowRight className="w-4 h-4 text-cyan-400" />
        </button>
      </header>

      {/* Main Split-Screen Hero Showcase */}
      <main className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 py-8 lg:py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
        {/* Left Column: Brand Proposition, Capabilities & Primary CTA (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Branded Clapperboard Badge & Kicker */}
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-cyan-400">
            <span>Write · Cast · Record · Pre-Visualize</span>
          </div>

          {/* Main Display Headline with Cyan-to-Amber Styling */}
          <div className="flex flex-col gap-3">
            <h1
              className="font-display font-extrabold tracking-tight text-3xl sm:text-5xl lg:text-[54px] leading-[1.08] text-white"
              style={{ textWrap: 'balance' }}
            >
              <span className="bg-gradient-to-r from-cyan-400 via-teal-200 to-amber-400 bg-clip-text text-transparent">
                STORYCAST AI
              </span>
              <span className="block text-xl sm:text-3xl lg:text-4xl font-bold text-slate-100 mt-2 tracking-normal">
                WRITE, CAST, &amp; GENERATE YOUR MOVIE
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Direct every beat from one production desk. Craft industry-standard screenplays with{' '}
              <span className="text-cyan-300 font-mono">@Character</span> tags, unlock custom faces
              and neural voices, record live studio microphone takes, and preview blocked camera
              shots in real time.
            </p>
          </div>

          {/* Primary Call-To-Action Block matching Poster Button */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button
              type="button"
              onClick={onStartNewScene}
              className="group relative px-7 py-4 rounded-full bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border-2 border-cyan-400/80 hover:border-amber-400 shadow-[0_0_30px_rgba(6,182,212,0.28)] hover:shadow-[0_0_36px_rgba(245,158,11,0.35)] transition-all duration-200 active:scale-95 flex items-center gap-3 whitespace-nowrap shrink-0"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-amber-400 text-slate-950 flex items-center justify-center">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </span>
              <span className="font-display font-extrabold text-sm sm:text-base tracking-wider uppercase bg-gradient-to-r from-cyan-300 via-slate-100 to-amber-300 bg-clip-text text-transparent">
                START CREATING NOW
              </span>
            </button>

            <button
              type="button"
              onClick={onEnterExistingStudio}
              className="px-5 py-3.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
            >
              Resume Studio ({sceneCount} Scenes · {castCount} Cast)
            </button>

            <PWAInstallButton variant="hero" />
          </div>

          {/* Editorial Numbered Studio Workflow Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800/90 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                <span>01. Screenplay Engine</span>
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Standard sluglines, visual prose prompts, and instant{' '}
                <span className="font-mono text-cyan-300">@Character</span> scene tagging.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800/90 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                <span>02. Cast Face &amp; Voice</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unlocked face reference portraits, custom photo uploads, and pitch/speed voice
                tuning.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800/90 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-pink-400">
                <span>03. Studio Mic &amp; Pre-Viz</span>
                <Mic className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Record live microphone dialogue takes with real-time cyan &amp; magenta waveform
                visualizers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Official STORYCAST AI Key Art Poster Showcase (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[460px] rounded-2xl bg-[#0d1322] border border-cyan-500/40 p-2.5 shadow-2xl">
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-slate-950 border border-slate-800">
              {!imgError ? (
                <img
                  src="/assets/aistudio/1793348816253_9dede57d.jpg"
                  alt="STORYCAST AI — Write, Cast, and Generate Your Movie creator studio poster"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
                  <Clapperboard className="w-12 h-12 text-cyan-400 mb-3" />
                  <div className="font-display font-bold text-lg text-white">STORYCAST AI</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Write, Cast, &amp; Generate Your Movie
                  </div>
                </div>
              )}

              {/* Subtle Interactive Bottom Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent p-4 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Creator Production Desk</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    Script · Cast · Multi-Track Waveform · Cinema Viewport
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onStartNewScene}
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-amber-400 text-slate-950 font-bold text-xs transition hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  Launch →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 py-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 relative z-10">
        <span>STORYCAST AI Production Studio · Screenplay, Cast &amp; Voice Synthesis</span>
        <span className="font-mono">16:9 HD &amp; 2.39:1 Anamorphic Ready</span>
      </footer>
    </div>
  );
};
