import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  PlusCircle,
  Volume2,
  Square,
  Grid,
  Copy,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import { CastMember, SceneShot, VisualStyle } from '../types/studio';

interface CinemaViewportProps {
  scenes: SceneShot[];
  currentSceneIndex: number;
  cast: CastMember[];
  isPlaying: boolean;
  isLooping: boolean;
  isWidescreen: boolean;
  activeSpeaker: string | null;
  activeSubtitle: string | null;
  isTableReading: boolean;
  onSelectScene: (idx: number) => void;
  onAddScene: () => void;
  onDuplicateScene: (idx: number) => void;
  onDeleteScene: (idx: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onToggleAspect: () => void;
  onChangeStyle: (style: VisualStyle) => void;
  onChangeCamera: (camera: string) => void;
  onToggleTableRead: () => void;
}

const CAMERA_PRESETS = [
  'CAMERA: Slow Dolly In [1.0x]',
  'CAMERA: Low Angle Pan [0.8x]',
  'CAMERA: Crane Orbit [1.2x]',
  'CAMERA: Steadicam Track [1.0x]',
  'CAMERA: Static Anamorphic Wide [1.0x]'
];

const COLOR_HEX: Record<string, string> = {
  orange: '#fb923c',
  cyan: '#22d3ee',
  pink: '#f472b6',
  amber: '#fbbf24',
  emerald: '#34d399'
};

export const CinemaViewport: React.FC<CinemaViewportProps> = ({
  scenes,
  currentSceneIndex,
  cast,
  isPlaying,
  isLooping,
  isWidescreen,
  activeSpeaker,
  activeSubtitle,
  isTableReading,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onTogglePlay,
  onToggleLoop,
  onToggleAspect,
  onChangeStyle,
  onChangeCamera,
  onToggleTableRead
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [timecodeFrames, setTimecodeFrames] = useState<number>(0);

  const activeScene = scenes[currentSceneIndex] || scenes[0];

  // Detect which characters are tagged in the current scene's script
  const taggedCharacters = cast.filter((c) => {
    const regex = new RegExp(`@${c.name}\\b`, 'i');
    return regex.test(activeScene.script);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const raindrops = Array.from({ length: 72 }, () => ({
      x: Math.random() * 640,
      y: Math.random() * 360,
      len: 11 + Math.random() * 16,
      speed: 4.5 + Math.random() * 5.5
    }));

    const buildings = [
      { x: 0, w: 64, h: 195 },
      { x: 68, w: 54, h: 145 },
      { x: 126, w: 72, h: 225 },
      { x: 202, w: 58, h: 160 },
      { x: 264, w: 80, h: 250 },
      { x: 348, w: 60, h: 175 },
      { x: 412, w: 68, h: 210 },
      { x: 484, w: 56, h: 150 },
      { x: 544, w: 76, h: 230 }
    ];

    let animId = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.max(320, Math.floor(rect.width));
      canvas.height = Math.max(180, Math.floor(rect.height));
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (isPlaying) {
        frameRef.current += 1;
        if (frameRef.current % 4 === 0) {
          setTimecodeFrames(frameRef.current);
        }
      }

      const f = frameRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const style = activeScene.style;

      // 1. Sky & Atmosphere Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (style === 'cyberpunk') {
        grad.addColorStop(0, '#040711');
        grad.addColorStop(0.55, '#0b1528');
        grad.addColorStop(1, '#17153b');
      } else if (style === 'noir') {
        grad.addColorStop(0, '#050507');
        grad.addColorStop(0.6, '#141418');
        grad.addColorStop(1, '#242429');
      } else if (style === 'anime') {
        grad.addColorStop(0, '#16113a');
        grad.addColorStop(0.55, '#311042');
        grad.addColorStop(1, '#581c5c');
      } else {
        // chiaroscuro
        grad.addColorStop(0, '#070504');
        grad.addColorStop(0.65, '#1c1208');
        grad.addColorStop(1, '#36210c');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Camera movement transform based on camera directive
      ctx.save();
      const cam = activeScene.camera.toLowerCase();
      let zoom = 1 + Math.sin(f * 0.008) * 0.045;
      let panX = 0;
      let panY = 0;

      if (cam.includes('pan')) {
        panX = Math.sin(f * 0.01) * 18;
        zoom = 1.04;
      } else if (cam.includes('orbit') || cam.includes('crane')) {
        panX = Math.cos(f * 0.012) * 14;
        panY = Math.sin(f * 0.012) * 8;
        zoom = 1.07;
      } else if (cam.includes('steadicam') || cam.includes('track')) {
        panX = Math.sin(f * 0.025) * 6;
        panY = Math.cos(f * 0.05) * 3;
        zoom = 1.05;
      }

      ctx.translate(w / 2 + panX, h / 2 + panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h / 2);

      // 3. Volumetric Neon Haze Orbs
      const orb1Color =
        style === 'noir'
          ? 'rgba(255,255,255,0.06)'
          : style === 'chiaroscuro'
          ? 'rgba(245, 158, 11, 0.16)'
          : 'rgba(6, 182, 212, 0.15)';
      const orb2Color =
        style === 'noir'
          ? 'rgba(255,255,255,0.04)'
          : style === 'chiaroscuro'
          ? 'rgba(217, 119, 6, 0.12)'
          : 'rgba(236, 72, 153, 0.14)';

      ctx.fillStyle = orb1Color;
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.44, 78, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = orb2Color;
      ctx.beginPath();
      ctx.arc(w * 0.74, h * 0.36, 68, 0, Math.PI * 2);
      ctx.fill();

      // 4. Skyline Architecture & Lit Windows
      buildings.forEach((b, idx) => {
        const bx = (b.x / 600) * w;
        const bw = (b.w / 600) * w;
        const bh = (b.h / 340) * h;
        const by = h - bh - h * 0.1;

        ctx.fillStyle = '#070a12';
        ctx.fillRect(bx, by, bw, bh);

        // Roof edge trim
        let roofColor = idx % 2 === 0 ? '#06b6d4' : '#ec4899';
        if (style === 'noir') roofColor = '#a1a1aa';
        if (style === 'chiaroscuro') roofColor = '#f59e0b';
        ctx.fillStyle = roofColor;
        ctx.fillRect(bx, by, bw, 2.5);

        // Windows
        let winColor = idx % 2 === 0 ? 'rgba(245, 158, 11, 0.75)' : 'rgba(34, 211, 238, 0.75)';
        if (style === 'noir') winColor = 'rgba(228, 228, 231, 0.65)';
        if (style === 'chiaroscuro') winColor = 'rgba(251, 191, 36, 0.7)';
        ctx.fillStyle = winColor;

        for (let wy = by + 12; wy < h - h * 0.14; wy += 16) {
          if ((Math.floor(wy) + idx) % 3 !== 0) {
            ctx.fillRect(bx + 7, wy, 5, 7);
            if (bw > 34) ctx.fillRect(bx + 18, wy, 5, 7);
            if (bw > 52) ctx.fillRect(bx + 29, wy, 5, 7);
          }
        }
      });

      // 5. Wet Asphalt Ground Plane & Anamorphic Reflections
      const groundY = h * 0.86;
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, groundY, w, h - groundY);

      ctx.fillStyle =
        style === 'noir'
          ? 'rgba(255,255,255,0.08)'
          : style === 'chiaroscuro'
          ? 'rgba(245, 158, 11, 0.18)'
          : 'rgba(34, 211, 238, 0.16)';
      ctx.fillRect(0, groundY, w, 2);

      // 6. Render Tagged Characters in Scene Blocking
      const charsToRender = taggedCharacters.length > 0 ? taggedCharacters : cast.slice(0, 1);
      charsToRender.forEach((char, i) => {
        const spacing = w / (charsToRender.length + 1);
        const cx = spacing * (i + 1);
        const cy = groundY + 4;
        const rimColor = COLOR_HEX[char.color] || '#22d3ee';
        const isSpeakingNow =
          activeSpeaker && activeSpeaker.toLowerCase().includes(char.name.toLowerCase());

        // Ground reflection streak
        ctx.fillStyle = rimColor;
        ctx.globalAlpha = isSpeakingNow ? 0.35 : 0.16;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6, 24, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Character silhouette body + rim light
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = rimColor;
        ctx.lineWidth = isSpeakingNow ? 2.4 : 1.5;

        // Trench / Torso
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy);
        ctx.lineTo(cx - 10, cy - 42);
        ctx.lineTo(cx + 10, cy - 42);
        ctx.lineTo(cx + 14, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 52, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Character Blocking Callout Label
        ctx.font = '500 10px "IBM Plex Mono", monospace';
        ctx.fillStyle = isSpeakingNow ? '#ffffff' : rimColor;
        ctx.textAlign = 'center';
        ctx.fillText(`@${char.name.toUpperCase()}`, cx, cy - 66);
      });

      ctx.restore();

      // 7. Falling Rain Streaks
      ctx.strokeStyle =
        style === 'noir'
          ? 'rgba(255,255,255,0.26)'
          : style === 'chiaroscuro'
          ? 'rgba(251, 191, 36, 0.28)'
          : 'rgba(34, 211, 238, 0.34)';
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      raindrops.forEach((r) => {
        const rx = (r.x / 640) * w;
        const ry = (r.y / 360) * h;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 2.5, ry + r.len);
        if (isPlaying) {
          r.y += r.speed;
          if (r.y > 360) {
            r.y = -15;
            r.x = Math.random() * 640;
          }
        }
      });
      ctx.stroke();

      // 8. Optional Rule-of-Thirds & Directorial Crosshair Grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Vertical thirds
        ctx.moveTo(w / 3, 0);
        ctx.lineTo(w / 3, h);
        ctx.moveTo((w * 2) / 3, 0);
        ctx.lineTo((w * 2) / 3, h);
        // Horizontal thirds
        ctx.moveTo(0, h / 3);
        ctx.lineTo(w, h / 3);
        ctx.moveTo(0, (h * 2) / 3);
        ctx.lineTo(w, (h * 2) / 3);
        ctx.stroke();

        // Center Crosshair
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.28)';
        ctx.beginPath();
        ctx.moveTo(w / 2 - 8, h / 2);
        ctx.lineTo(w / 2 + 8, h / 2);
        ctx.moveTo(w / 2, h / 2 - 8);
        ctx.lineTo(w / 2, h / 2 + 8);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [activeScene, isPlaying, showGrid, taggedCharacters, cast, activeSpeaker]);

  // Format SMPTE timecode 00:00:SS:FF
  const formatTimecode = (frames: number) => {
    const totalSeconds = Math.floor(frames / 24) % Math.max(1, activeScene.durationSec);
    const ff = frames % 24;
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `00:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
  };

  return (
    <section className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 flex flex-col gap-4">
      {/* Scene Title & Metadata Header (Zero-Pill Unboxed Metadata) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <div className="text-xs font-mono text-cyan-400 tabular-nums">
            {activeScene.slugline}
          </div>
          <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
            Scene {currentSceneIndex + 1}: {activeScene.title}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
          <span>{activeScene.lens}</span>
          <span aria-hidden="true">·</span>
          <span>~{activeScene.durationSec}s est</span>
        </div>
      </div>

      {/* Streamlined Camera & Style Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 p-2 rounded-xl border border-slate-800/90 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            aria-label="Visual Style"
            value={activeScene.style}
            onChange={(e) => onChangeStyle(e.target.value as VisualStyle)}
            className="bg-slate-900 text-slate-200 border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="cyberpunk">Cyberpunk VFX</option>
            <option value="noir">Tech Noir</option>
            <option value="anime">Synth Anime</option>
            <option value="chiaroscuro">Sodium Chiaroscuro</option>
          </select>

          <select
            aria-label="Camera Motion Directive"
            value={activeScene.camera}
            onChange={(e) => onChangeCamera(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
          >
            {CAMERA_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset.replace('CAMERA: ', '')}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Rule-of-Thirds Viewfinder Grid"
            className={`px-2 py-1.5 rounded-lg border font-mono transition whitespace-nowrap shrink-0 flex items-center gap-1 ${
              showGrid
                ? 'bg-slate-800 border-slate-600 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={onToggleAspect}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-400 font-mono hover:border-cyan-500/50 transition whitespace-nowrap shrink-0 tabular-nums"
          >
            {isWidescreen ? '2.39:1' : '16:9'}
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            className={`px-2.5 py-1.5 rounded-lg border font-medium transition whitespace-nowrap shrink-0 ${
              isLooping
                ? 'bg-cyan-950/60 border-cyan-600/50 text-cyan-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-400'
            }`}
          >
            Loop: {isLooping ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Interactive Canvas Video Player */}
      <div
        className={`relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group transition-all duration-200 ${
          isWidescreen ? 'aspect-[2.39/1]' : 'aspect-video'
        }`}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top Viewfinder HUD Overlay (Unboxed Telemetry) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none text-[11px] font-mono tabular-nums">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-md text-cyan-300">
            {activeScene.camera}
          </div>
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-md text-slate-300">
            TC {formatTimecode(timecodeFrames)} · 24fps
          </div>
        </div>

        {/* Center Play/Pause Button */}
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause scene preview' : 'Play scene preview'}
          className="absolute inset-0 m-auto w-13 h-13 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transition transform hover:scale-105 active:scale-95 opacity-90 group-hover:opacity-100"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Bottom Scrim + Live Table Read Subtitle or Blocking Summary */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-3 pt-8 pointer-events-none flex items-end justify-between gap-3">
          {activeSubtitle ? (
            <div className="w-full text-center">
              <span className="text-[11px] font-mono uppercase text-cyan-400 block">
                {activeSpeaker}
              </span>
              <p className="text-xs sm:text-sm text-white font-medium leading-snug drop-shadow">
                “{activeSubtitle}”
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between w-full text-[11px] text-slate-300 font-mono gap-2">
              <span className="truncate max-w-[65%]">
                Cast in Shot:{' '}
                {taggedCharacters.length > 0
                  ? taggedCharacters.map((c) => `@${c.name}`).join(' · ')
                  : 'Environment Master'}
              </span>
              <span className="text-slate-400 tabular-nums">
                Tension {activeScene.tensionLevel}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live Dialogue Table Read Action Strip */}
      <div className="flex items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5">
        <div className="text-xs">
          <span className="font-medium text-slate-200">Scene Table Read & Voice Sync</span>
          <span className="text-slate-400 block text-[11px]">
            Synthesizes character lines using unlocked Cast Voice profiles
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleTableRead}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
            isTableReading
              ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
              : 'bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
          }`}
        >
          {isTableReading ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Read</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Audition Scene</span>
            </>
          )}
        </button>
      </div>

      {/* Sequenced Shot Timeline */}
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sequenced Shot Timeline ({scenes.length} Shots)</span>
          </div>
          <button
            type="button"
            onClick={onAddScene}
            className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Blank Scene</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {scenes.map((scene, idx) => {
            const active = idx === currentSceneIndex;
            return (
              <div
                key={scene.id}
                onClick={() => onSelectScene(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectScene(idx);
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  active
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[10px] font-mono uppercase tabular-nums ${
                      active ? 'text-cyan-400 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    Shot {String(idx + 1).padStart(2, '0')} · {scene.durationSec}s
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateScene(idx);
                      }}
                      title="Duplicate Shot"
                      className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {scenes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteScene(idx);
                        }}
                        title="Delete Shot"
                        className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs font-semibold truncate w-full">{scene.title}</div>
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  {scene.style} · {scene.camera.replace('CAMERA: ', '')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
