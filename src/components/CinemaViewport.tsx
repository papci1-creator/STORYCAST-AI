import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  PlusCircle,
  Volume2,
  Square,
  Copy,
  Trash2,
  SlidersHorizontal,
  Film,
  Sparkles,
  Download,
  Upload,
  Maximize2,
  Loader2,
  FastForward,
  Eye,
  Image as ImageIcon,
  Edit3,
  X
} from 'lucide-react';
import {
  CastMember,
  ColorGradeLook,
  SceneShot,
  ShotSfxType,
  VideoEngineModel,
  VisualStyle
} from '../types/studio';
import { studioAudio } from '../utils/audioEngine';

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
  isGeneratingVideo: boolean;
  videoProgress: number;
  selectedVideoEngine: VideoEngineModel;
  onChangeVideoEngine: (engine: VideoEngineModel) => void;
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
  onGenerateVeoVideo: (extend?: boolean) => void;
  onUpdateSceneVideoConfig: (patch: Partial<SceneShot>) => void;
  onUpdateShotByIndex: (idx: number, patch: Partial<SceneShot>) => void;
  onUploadSceneVideo: (url: string) => void;
  onStitchAndPlayFullMovie: () => void;
  onRenderAllShotsBatch: () => void;
  onTriggerShotSfx: (sfx?: ShotSfxType) => void;
}

const CAMERA_PRESETS = [
  'Wide Aerial Drone Pan [0.8x]',
  'Medium Two-Shot | 50mm Prime',
  'Over-The-Shoulder Close-Up',
  'Low Angle Rear Tracking Shot',
  'Slow Dolly In [1.0x]',
  'Crane Orbit [1.2x]'
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
  isGeneratingVideo,
  videoProgress,
  selectedVideoEngine,
  onChangeVideoEngine,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onTogglePlay,
  onToggleLoop,
  onToggleAspect,
  onChangeCamera,
  onToggleTableRead,
  onGenerateVeoVideo,
  onUpdateSceneVideoConfig,
  onUpdateShotByIndex,
  onUploadSceneVideo,
  onStitchAndPlayFullMovie,
  onRenderAllShotsBatch,
  onTriggerShotSfx
}) => {
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<number>(0);

  const [viewportMode, setViewportMode] = useState<'photoreal' | 'canvas'>('photoreal');
  const [colorGradeLook, setColorGradeLook] = useState<ColorGradeLook>('orchard');
  const [dollyKey, setDollyKey] = useState<number>(0);

  // Scrubber & Playback state
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Edit Shot Modal state
  const [editingShotIdx, setEditingShotIdx] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editSpeaker, setEditSpeaker] = useState<string>('');
  const [editDialogue, setEditDialogue] = useState<string>('');
  const [editSfx, setEditSfx] = useState<ShotSfxType>('guitar');

  const activeScene = scenes[currentSceneIndex] || scenes[0];
  const shotDuration = Math.max(1, activeScene.durationSec || 4.5);

  // Cross-fade transition state between shots
  const prevSceneRef = useRef<SceneShot>(activeScene);
  const [outgoingScene, setOutgoingScene] = useState<SceneShot | null>(null);
  const [isCrossFading, setIsCrossFading] = useState<boolean>(false);

  // Trigger smooth cross-fade and restart Ken Burns dolly animation when switching shots
  useEffect(() => {
    setDollyKey((prev) => prev + 1);
    setElapsedSec(0);

    if (prevSceneRef.current && prevSceneRef.current.id !== activeScene.id) {
      setOutgoingScene(prevSceneRef.current);
      setIsCrossFading(true);
      prevSceneRef.current = activeScene;

      const fadeTimer = window.setTimeout(() => {
        setIsCrossFading(false);
        setOutgoingScene(null);
      }, 650);

      return () => window.clearTimeout(fadeTimer);
    } else {
      prevSceneRef.current = activeScene;
    }
  }, [currentSceneIndex, activeScene]);

  // Sync HTML5 <video> play/pause with studio isPlaying state
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !activeScene.videoUrl) return;
    if (isPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isPlaying, activeScene.videoUrl]);

  // Advance scrubber timer when playing keyframe preview
  useEffect(() => {
    if (!isPlaying || activeScene.videoUrl) return;
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 0.1 * playbackRate;
        if (next >= shotDuration) {
          return isLooping ? 0 : shotDuration;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [isPlaying, activeScene.videoUrl, playbackRate, shotDuration, isLooping]);

  // Detect which characters are in the current shot
  const actorsInShot = React.useMemo(() => {
    if (activeScene.actors && activeScene.actors.length > 0) {
      const matched = activeScene.actors
        .map((actorName) =>
          cast.find((c) => c.name.toLowerCase() === actorName.toLowerCase())
        )
        .filter((c): c is CastMember => Boolean(c));
      if (matched.length > 0) return matched;
    }
    const tagged = cast.filter((c) =>
      new RegExp(`@${c.name}\\b`, 'i').test(activeScene.script)
    );
    return tagged.length > 0 ? tagged : cast.slice(0, 2);
  }, [activeScene, cast]);

  // Blocking View Canvas Renderer (when user switches to 'canvas' mode)
  useEffect(() => {
    if (viewportMode !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
      if (isPlaying) frameRef.current += 1;
      const f = frameRef.current;
      const w = canvas.width;
      const h = canvas.height;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.55, '#fbbf24');
      grad.addColorStop(0.6, '#14532d');
      grad.addColorStop(1, '#052e16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const horizonY = h * 0.55;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(w * 0.4, horizonY);
      ctx.lineTo(w * 0.6, horizonY);
      ctx.lineTo(w * 0.82, h);
      ctx.lineTo(w * 0.18, h);
      ctx.closePath();
      ctx.fill();

      actorsInShot.forEach((char, i) => {
        const spacing = w / (actorsInShot.length + 1);
        const cx = spacing * (i + 1) + Math.sin(f * 0.04 + i) * 3;
        const cy = h * 0.86;
        const rimColor = COLOR_HEX[char.color] || '#22d3ee';

        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = rimColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy);
        ctx.lineTo(cx - 12, cy - 48);
        ctx.lineTo(cx + 12, cy - 48);
        ctx.lineTo(cx + 16, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy - 58, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '600 10px "IBM Plex Mono", monospace';
        ctx.fillStyle = rimColor;
        ctx.textAlign = 'center';
        ctx.fillText(`@${char.name.toUpperCase()}`, cx, cy - 74);
      });

      // Rule of thirds grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 3, 0);
      ctx.lineTo(w / 3, h);
      ctx.moveTo((w * 2) / 3, 0);
      ctx.lineTo((w * 2) / 3, h);
      ctx.moveTo(0, h / 3);
      ctx.lineTo(w, h / 3);
      ctx.moveTo(0, (h * 2) / 3);
      ctx.lineTo(w, (h * 2) / 3);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [viewportMode, isPlaying, actorsInShot]);

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUploadSceneVideo(url);
    setViewportMode('photoreal');
  };

  const handleKeyframeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdateSceneVideoConfig({
      keyframeUrl: url,
      videoUrl: undefined,
      status: 'KEYFRAME READY'
    });
    setViewportMode('photoreal');
  };

  const handleCyclePlaybackRate = () => {
    const rates = [0.8, 1.0, 1.25, 1.5];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const handleFullscreen = () => {
    const el = viewportContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const openShotEditor = (idx: number) => {
    const s = scenes[idx];
    if (!s) return;
    setEditingShotIdx(idx);
    setEditTitle(s.title);
    setEditPrompt(s.prompt || s.lighting);
    setEditSpeaker(s.speaker || cast[0]?.name || 'Marcus');
    setEditDialogue(s.dialogue || '');
    setEditSfx(s.sfx || 'guitar');
  };

  const saveShotEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShotIdx === null) return;
    onUpdateShotByIndex(editingShotIdx, {
      title: editTitle.trim() || `Shot ${editingShotIdx + 1}`,
      prompt: editPrompt.trim(),
      speaker: editSpeaker.trim().replace(/^@/, ''),
      dialogue: editDialogue.trim(),
      sfx: editSfx
    });
    setEditingShotIdx(null);
  };

  const lookClass =
    colorGradeLook === 'kodak'
      ? 'look-kodak'
      : colorGradeLook === 'cyberpunk'
      ? 'look-cyberpunk'
      : 'look-orchard';

  const defaultDialogueLine =
    activeSubtitle ||
    activeScene.dialogue ||
    'You taking that heap? They judge an apple by how shiny the wax is, not the root.';
  const defaultSpeakerName = (activeSpeaker || activeScene.speaker || 'Arthur')
    .replace(/^@/, '')
    .toUpperCase();

  return (
    <section className="bg-[#0b111e] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xl">
      {/* Top Render Controls Bar */}
      <div className="bg-[#101829] border border-slate-800/90 rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Video Resolution"
            value={activeScene.videoResolution || '1080p'}
            onChange={(e) =>
              onUpdateSceneVideoConfig({
                videoResolution: e.target.value as '720p' | '1080p' | '4k'
              })
            }
            className="bg-[#090f1c] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="720p">720p HD</option>
            <option value="1080p">1080p Full HD</option>
            <option value="4k">4K Cinema</option>
          </select>

          <select
            aria-label="Video Duration"
            value={activeScene.videoClipDuration || '5s'}
            onChange={(e) => {
              const val = e.target.value as '4s' | '5s' | '10s';
              onUpdateSceneVideoConfig({
                videoClipDuration: val,
                durationSec: parseInt(val, 10)
              });
            }}
            className="bg-[#090f1c] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="4s">4s Clip</option>
            <option value="5s">5s Clip</option>
            <option value="10s">10s Clip</option>
          </select>

          <select
            aria-label="Video Engine Model"
            value={selectedVideoEngine}
            onChange={(e) => onChangeVideoEngine(e.target.value as VideoEngineModel)}
            className="bg-[#090f1c] border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono flex-1 min-w-[180px] focus:outline-none focus:border-cyan-400"
          >
            <option value="fal-ai/veo3">Veo 3.1 Realistic Cinema</option>
            <option value="fal-ai/kling-video/v2/master/image-to-video">
              Kling 3.0 Master (Face Lock)
            </option>
            <option value="fal-ai/runway-gen4">Runway Gen-4 Turbo</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isGeneratingVideo}
              onClick={() => onGenerateVeoVideo(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-400 to-amber-400 hover:opacity-95 text-slate-950 flex items-center gap-1.5 shadow transition active:scale-95 whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {isGeneratingVideo ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering {videoProgress}%</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Render Realistic Video</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isGeneratingVideo}
              onClick={() => {
                onUpdateSceneVideoConfig({
                  durationSec: Number((shotDuration + 5.0).toFixed(1))
                });
                onGenerateVeoVideo(true);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 transition whitespace-nowrap shrink-0"
            >
              <FastForward className="w-3 h-3" />
              <span>+5s Extend</span>
            </button>

            <label className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer flex items-center gap-1 transition whitespace-nowrap shrink-0">
              <Upload className="w-3 h-3 text-cyan-400" />
              <span>Load MP4</span>
              <input
                type="file"
                accept="video/mp4,video/*"
                className="hidden"
                onChange={handleVideoFileUpload}
              />
            </label>

            <label className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 cursor-pointer flex items-center gap-1 transition whitespace-nowrap shrink-0">
              <ImageIcon className="w-3 h-3" />
              <span>Keyframe Img</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleKeyframeFileUpload}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() =>
              setViewportMode(viewportMode === 'photoreal' ? 'canvas' : 'photoreal')
            }
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 transition whitespace-nowrap shrink-0"
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>{viewportMode === 'photoreal' ? 'Blocking Grid' : 'Photoreal View'}</span>
          </button>
        </div>
      </div>

      {/* Camera & Scene Preset Bar */}
      <div className="bg-[#101829] border border-slate-800/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Color Grade Look"
            value={colorGradeLook}
            onChange={(e) => setColorGradeLook(e.target.value as ColorGradeLook)}
            className="bg-[#090f1c] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-cyan-500"
          >
            <option value="orchard">Golden Hour Orchard</option>
            <option value="kodak">35mm Kodak Film</option>
            <option value="cyberpunk">Cyberpunk Neon</option>
          </select>

          <select
            aria-label="Camera Motion Directive"
            value={activeScene.camera.replace('CAMERA: ', '')}
            onChange={(e) => onChangeCamera(e.target.value)}
            className="bg-[#090f1c] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            {CAMERA_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <button
            type="button"
            onClick={onToggleAspect}
            className="px-2 py-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 tabular-nums"
          >
            {isWidescreen ? '2.39:1' : '16:9'}
          </button>
          <button
            type="button"
            onClick={onToggleLoop}
            className={`px-2 py-1 rounded border transition ${
              isLooping
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            Loop: {isLooping ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* PHOTOREALISTIC CINEMA VIEWPORT */}
      <div
        ref={viewportContainerRef}
        className={`relative w-full bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner transition-all duration-200 ${
          isWidescreen ? 'aspect-[2.39/1]' : 'aspect-video'
        }`}
      >
        {viewportMode === 'canvas' ? (
          <canvas ref={canvasRef} className="w-full h-full block" />
        ) : (
          <div className="relative w-full h-full overflow-hidden bg-black">
            {/* Outgoing Shot Layer (Cross-Dissolve Out) */}
            {isCrossFading && outgoingScene && (
              <div
                key={`outgoing-${outgoingScene.id}`}
                className="absolute inset-0 w-full h-full pointer-events-none z-10 animate-shot-fade-out"
              >
                {outgoingScene.videoUrl ? (
                  <video
                    src={outgoingScene.videoUrl}
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${lookClass}`}
                  />
                ) : (
                  <img
                    src={
                      outgoingScene.keyframeUrl ||
                      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&auto=format&fit=crop&q=80'
                    }
                    alt={outgoingScene.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${lookClass}`}
                  />
                )}
              </div>
            )}

            {/* Incoming Active Shot Layer (Cross-Dissolve In + Ken Burns Dolly) */}
            {activeScene.videoUrl ? (
              <video
                key={`video-${activeScene.id}`}
                ref={videoRef}
                src={activeScene.videoUrl}
                loop={isLooping}
                playsInline
                autoPlay
                onTimeUpdate={(e) => setElapsedSec(e.currentTarget.currentTime)}
                onClick={onTogglePlay}
                className={`w-full h-full object-cover cursor-pointer animate-shot-fade-in ${lookClass}`}
              />
            ) : (
              <img
                key={`${activeScene.id}-${dollyKey}`}
                src={
                  activeScene.keyframeUrl ||
                  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&auto=format&fit=crop&q=80'
                }
                alt={activeScene.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover animate-dolly-crossfade transition-all duration-500 ${lookClass}`}
              />
            )}
          </div>
        )}

        {/* Cinematic Vignette & Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50 pointer-events-none z-20" />

        {/* Top HUD Overlays */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2 pointer-events-none z-30">
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono">
            <div className="text-cyan-300 font-semibold">
              {activeScene.videoSource || 'Veo 3.1 Realistic Cinema Stream'} •{' '}
              {(activeScene.videoResolution || '1080p').toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-400">
              🎥 {activeScene.camera.replace('CAMERA: ', '')}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="px-2 py-1 rounded-lg bg-emerald-950/85 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono leading-tight">
              LIP-SYNC:
              <br />
              <strong>ACTIVE</strong>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700 text-[11px] text-slate-200 font-mono tabular-nums">
              <span>{elapsedSec.toFixed(1)}s</span> / <span>{shotDuration.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        {/* Locked Character Face Badges on Viewport */}
        <div
          key={`badges-${activeScene.id}`}
          className="absolute top-16 left-2.5 flex flex-wrap gap-1.5 pointer-events-none z-30 animate-shot-fade-in"
        >
          {actorsInShot.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/85 border border-cyan-500/40 text-[10px] text-cyan-200 font-mono shadow"
            >
              <img
                src={c.avatarUrl}
                alt={c.name}
                referrerPolicy="no-referrer"
                className="w-3.5 h-3.5 rounded-full object-cover"
              />
              <span>@{c.name} Locked</span>
            </div>
          ))}
        </div>

        {/* Live Subtitle Overlay */}
        <div
          key={`subtitle-${activeScene.id}-${defaultSpeakerName}`}
          className="absolute bottom-14 inset-x-4 text-center pointer-events-none z-30 animate-shot-fade-in"
        >
          <div className="inline-block px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-sm border border-white/10 text-xs leading-snug max-w-md">
            <span className="text-cyan-400 font-bold font-mono mr-1.5">
              {defaultSpeakerName}:
            </span>
            <span className="text-white">&ldquo;{defaultDialogueLine}&rdquo;</span>
          </div>
        </div>

        {/* Scrubber & Transport Controls */}
        <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/95 to-transparent flex flex-col gap-1.5 z-30">
          <input
            type="range"
            min={0}
            max={shotDuration}
            step={0.1}
            value={Math.min(shotDuration, elapsedSec)}
            onChange={(e) => {
              const t = parseFloat(e.target.value);
              setElapsedSec(t);
              if (videoRef.current && activeScene.videoUrl) {
                videoRef.current.currentTime = t;
              }
            }}
            aria-label="Timeline scrubber"
            className="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer accent-cyan-400"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onTogglePlay}
                className="w-8 h-7 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center transition"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={handleCyclePlaybackRate}
                className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 font-mono tabular-nums"
              >
                {playbackRate}x
              </button>

              <button
                type="button"
                onClick={() => onTriggerShotSfx(activeScene.sfx || 'guitar')}
                title="Trigger Shot SFX"
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[11px] text-amber-300 border border-amber-500/30 font-mono flex items-center gap-1 transition"
              >
                <Volume2 className="w-3 h-3" />
                <span>SFX ({activeScene.sfx || 'guitar'})</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {activeScene.videoUrl ? (
                <a
                  href={activeScene.videoUrl}
                  download={`storycast-shot-${currentSceneIndex + 1}.webm`}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>Save Video</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onGenerateVeoVideo(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>Save Video</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleFullscreen}
                title="Fullscreen Viewport"
                className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scene Table Read & Multi-Track Sync Card */}
      <div className="bg-[#101829] border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-white flex flex-wrap items-center gap-1.5">
            <span>Scene Table Read &amp; Multi-Track Sync</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
              Auto-Duck ON
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Plays character voice + acoustic guitar score + scene SFX
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            studioAudio.playAcousticChord(0.45);
            if (activeScene.sfx === 'slam') {
              window.setTimeout(() => studioAudio.playTrunkSlamSfx(0.85), 1400);
            } else if (activeScene.sfx === 'engine') {
              window.setTimeout(() => studioAudio.playEngineAccelSfx(0.85), 1100);
            }
            onToggleTableRead();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
            isTableReading
              ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
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

      {/* INTERACTIVE MULTI-SHOT TIMELINE */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-300 font-mono flex items-center gap-1.5 uppercase">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Multi-Shot Timeline ({scenes.length} Shots)</span>
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRenderAllShotsBatch}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline font-mono font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Render All</span>
            </button>
            <button
              type="button"
              onClick={onAddScene}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-mono font-semibold flex items-center gap-1"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Add Blank Shot</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {scenes.map((scene, idx) => {
            const active = idx === currentSceneIndex;
            const statusText = scene.videoUrl
              ? 'MP4 READY'
              : scene.status || 'VIDEO READY';
            return (
              <div
                key={scene.id}
                onClick={() => onSelectScene(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectScene(idx);
                }}
                className={`cursor-pointer rounded-xl p-2.5 border transition flex items-center gap-3 ${
                  active
                    ? 'bg-[#122138] border-cyan-400 shadow-md'
                    : 'bg-[#0e1627] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Photorealistic Keyframe Thumbnail */}
                <div className="relative w-20 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-950">
                  <img
                    src={
                      scene.keyframeUrl ||
                      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=80'
                    }
                    alt={scene.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/85 text-[9px] text-cyan-300 font-mono tabular-nums">
                    {scene.durationSec}s
                  </span>
                </div>

                {/* Shot Metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold tracking-wider font-mono tabular-nums ${
                        statusText.includes('READY') ? 'text-cyan-400' : 'text-amber-400'
                      }`}
                    >
                      SHOT {idx + 1} • {statusText}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      🔊 {scene.sfx || 'guitar'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate mt-0.5">
                    {scene.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    🗣️ {scene.speaker || 'Actor'}: &ldquo;
                    {scene.dialogue || scene.lighting}&rdquo;
                  </div>
                </div>

                {/* Quick Shot Actions */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => openShotEditor(idx)}
                    title="Edit Shot Prompt & Keyframe"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateScene(idx)}
                    title="Duplicate Shot"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteScene(idx)}
                      title="Delete Shot"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stitch & Play All Shots Sequentially CTA */}
        <button
          type="button"
          onClick={onStitchAndPlayFullMovie}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 text-slate-950 shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Film className="w-4 h-4 stroke-[2.5]" />
          <span>Stitch &amp; Play All Shots Sequentially (Full Scene)</span>
        </button>
      </div>

      {/* MODAL: EDIT SHOT PROMPT & KEYFRAME */}
      {editingShotIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveShotEditor}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-4 space-y-3 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                <span>Edit Shot {editingShotIdx + 1} Prompt &amp; Lip-Sync</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingShotIdx(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Shot Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Visual Generation Prompt (Sent to Veo 3.1 / Kling 3.0)
              </label>
              <textarea
                rows={3}
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Speaker (@Character)</label>
                <input
                  type="text"
                  value={editSpeaker}
                  onChange={(e) => setEditSpeaker(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">SFX Trigger</label>
                <select
                  value={editSfx}
                  onChange={(e) => setEditSfx(e.target.value as ShotSfxType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="guitar">Acoustic Guitar Intro</option>
                  <option value="slam">Heavy Car Trunk Slam</option>
                  <option value="engine">Car Engine Acceleration</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Dialogue Line (Lip-Sync)</label>
              <input
                type="text"
                value={editDialogue}
                onChange={(e) => setEditDialogue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingShotIdx(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              >
                Save Shot
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
