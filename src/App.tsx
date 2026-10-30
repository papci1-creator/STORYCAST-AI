import React, { useState, useRef } from 'react';
import {
  FileText,
  Users,
  Mic,
  Compass,
  Download,
  Tag,
  Wand2,
  MessageSquarePlus,
  Film,
  Zap,
  Sparkles,
  UserCog,
  Unlock,
  Lock,
  UserPlus,
  Camera,
  Volume2,
  Sliders,
  Loader2,
  Eye,
  Edit3,
  Plus,
  Check,
  Radio,
  Clapperboard
} from 'lucide-react';
import {
  CastMember,
  SceneShot,
  StoryBeat,
  AudioTrackMix,
  VisualStyle,
  VoiceTake
} from './types/studio';
import {
  INITIAL_CAST,
  INITIAL_SCENES,
  INITIAL_BEATS,
  INITIAL_AUDIO_MIX
} from './data/initialStudioData';
import { CinemaViewport } from './components/CinemaViewport';
import { CastModal } from './components/CastModal';
import { SplashLanding } from './components/SplashLanding';
import { StudioMicRecorder } from './components/StudioMicRecorder';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { studioAudio } from './utils/audioEngine';
import { synthesizeRealisticSceneVideo } from './utils/videoRenderer';

type ViewMode = 'splash' | 'studio';
type ActiveTab = 'script' | 'cast' | 'director' | 'audio';
type ScriptSubMode = 'editor' | 'formatted';

const COLOR_STYLES: Record<
  string,
  { dot: string; box: string; text: string }
> = {
  orange: {
    dot: 'bg-orange-400',
    box: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
    text: 'text-orange-400'
  },
  cyan: {
    dot: 'bg-cyan-400',
    box: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
    text: 'text-cyan-400'
  },
  pink: {
    dot: 'bg-pink-500',
    box: 'bg-pink-500/15 border-pink-500/40 text-pink-300',
    text: 'text-pink-400'
  },
  amber: {
    dot: 'bg-amber-400',
    box: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    text: 'text-amber-400'
  },
  emerald: {
    dot: 'bg-emerald-400',
    box: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    text: 'text-emerald-400'
  }
};

export default function App() {
  // Top-level View Mode ('splash' full-screen poster showcase vs 'studio' workspace)
  const [viewMode, setViewMode] = useState<ViewMode>('splash');
  const [activeTab, setActiveTab] = useState<ActiveTab>('script');
  const [scriptSubMode, setScriptSubMode] = useState<ScriptSubMode>('editor');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Studio Core Data
  const [logline, setLogline] = useState<string>(
    'In rain-drenched Neo-Tokyo, an ocular cyber-detective and a fugitive netrunner must breach an orbital memory spire before a syndicate erases the city’s last uncorrupted witness.'
  );
  const [cast, setCast] = useState<CastMember[]>(INITIAL_CAST);
  const [scenes, setScenes] = useState<SceneShot[]>(INITIAL_SCENES);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [beats, setBeats] = useState<StoryBeat[]>(INITIAL_BEATS);
  const [audioTracks, setAudioTracks] = useState<AudioTrackMix[]>(INITIAL_AUDIO_MIX);

  // Live Studio Microphone Voice Takes
  const [selectedMicCharId, setSelectedMicCharId] = useState<string>(INITIAL_CAST[0].id);
  const [voiceTakes, setVoiceTakes] = useState<VoiceTake[]>([
    {
      id: 'take-initial-1',
      characterId: 'char-1',
      characterName: 'Elena',
      sceneId: 1,
      lineText: 'The signal is coming from beneath the reactor core. Stay sharp, Leo.',
      durationSec: 3.8,
      createdAt: 'Studio Master',
      source: 'Studio Synth'
    }
  ]);

  // Player & Synthesis state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isWidescreen, setIsWidescreen] = useState<boolean>(false);
  const [isRenderingScene, setIsRenderingScene] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isTableReading, setIsTableReading] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);

  // Audio Mix state
  const [isAtmosLive, setIsAtmosLive] = useState<boolean>(false);
  const [autoDuckDialogue, setAutoDuckDialogue] = useState<boolean>(true);

  // Modal state
  const [isCastModalOpen, setIsCastModalOpen] = useState<boolean>(false);
  const [editingCharacter, setEditingCharacter] = useState<CastMember | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const scriptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeScene = scenes[currentSceneIndex] || scenes[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2600);
  };

  // Launch from Splash "START CREATING NOW" button -> enters Studio & focuses Script Editor
  const handleStartCreatingFromSplash = () => {
    setViewMode('studio');
    setActiveTab('script');
    setScriptSubMode('editor');
    studioAudio.playCueChime(1.15);
    showToast('Studio ready — start writing or tag @Characters in Scene');
    setTimeout(() => {
      scriptTextareaRef.current?.focus();
    }, 80);
  };

  // Word & character counts
  const rawScript = activeScene.script;
  const trimmedScript = rawScript.trim();
  const wordCount = trimmedScript ? trimmedScript.split(/\s+/).length : 0;
  const charCount = rawScript.length;
  const estPages = Math.max(0.2, Math.round((wordCount / 180) * 10) / 10);

  // Update current scene helper
  const updateActiveScene = (patch: Partial<SceneShot>) => {
    setScenes((prev) =>
      prev.map((s, idx) => (idx === currentSceneIndex ? { ...s, ...patch } : s))
    );
  };

  // Insert character tag or industry screenplay element at cursor
  const insertAtEndOrCursor = (snippet: string, toastLabel?: string) => {
    const currentText = activeScene.script;
    const prefix =
      currentText.endsWith(' ') || currentText.endsWith('\n') || currentText.length === 0
        ? ''
        : ' ';
    const updated = `${currentText}${prefix}${snippet}`;
    updateActiveScene({ script: updated });
    if (toastLabel) showToast(toastLabel);
    setTimeout(() => {
      scriptTextareaRef.current?.focus();
    }, 20);
  };

  // Industry formatting helper buttons
  const insertFormattingElement = (
    elementType: 'slugline' | 'action' | 'character' | 'parenthetical' | 'transition' | 'foley'
  ) => {
    const leadChar = cast[0]?.name || 'Elena';
    const secondChar = cast[1]?.name || 'Leo';
    const map: Record<typeof elementType, { text: string; label: string }> = {
      slugline: {
        text: '\n\nINT. SUBLEVEL COOLING CONDUIT - CONTINUOUS\n',
        label: 'Inserted Slugline (Scene Heading)'
      },
      action: {
        text: '\nCondensation drips from overhead coolant pipes onto the rusted catwalk. Neon light fractures across wet steel.',
        label: 'Inserted Visual & Sensory Action Line'
      },
      character: {
        text: `\n\n@${leadChar}\n`,
        label: `Inserted Character Cue (@${leadChar})`
      },
      parenthetical: {
        text: '\n(voice low, scanning the shadows)\n',
        label: 'Inserted Parenthetical Direction'
      },
      transition: {
        text: '\n\nSMASH CUT TO:\n',
        label: 'Inserted Transition'
      },
      foley: {
        text: `\n[FOLEY CUE: High-voltage transformer hum spikes as @${secondChar}'s deck locks the frequency]`,
        label: 'Inserted Diegetic Foley Cue'
      }
    };

    const item = map[elementType];
    updateActiveScene({ script: `${activeScene.script.trimEnd()}${item.text}` });
    showToast(item.label);
  };

  // AI Auto-Complete snippets
  const handleAiInsert = (type: 'dialogue' | 'prompt' | 'beat') => {
    const lead = cast[0]?.name || 'Elena';
    const partner = cast[1]?.name || 'Leo';
    const snippets: Record<typeof type, string> = {
      dialogue: `\n\n@${lead}\n(keeping her eyes on the thermal display)\n"The signal is coming from beneath the reactor core. Stay sharp, @${partner}."`,
      prompt: `\n\n[VFX & LIGHTING PROMPT: Volumetric cyan fog, wet asphalt reflections, 35mm anamorphic lens flare, sodium vapor rim light]`,
      beat: `\n\nSuddenly, a syndicate recon drone sweeps its crimson searchlight across the flooded plaza—forcing @${lead} behind the blast pillar.`
    };
    updateActiveScene({ script: `${activeScene.script.trimEnd()}${snippets[type]}` });
    showToast(
      `Added ${
        type === 'dialogue'
          ? 'subtext dialogue'
          : type === 'prompt'
          ? 'visual scene prompt'
          : 'narrative beat'
      }`
    );
  };

  // Veo 3 Realistic Video Generator (calls /api/video/generate with automatic Studio Cinema WebM Renderer fallback)
  const handleGenerateVeoVideo = async (extend = false) => {
    if (isRenderingScene) return;
    setIsRenderingScene(true);
    setVideoProgress(8);
    studioAudio.playCueChime(1.2);

    const activeCharacters = cast.filter((c) =>
      activeScene.script.toLowerCase().includes(`@${c.name.toLowerCase()}`)
    );
    const charDescriptions = (activeCharacters.length > 0 ? activeCharacters : cast.slice(0, 2))
      .map((c) => `${c.name} (${c.role}, ${c.appearance})`)
      .join('; ');

    const promptText = `${activeScene.slugline}. Style: ${activeScene.style}. Camera: ${activeScene.camera}, Lens: ${activeScene.lens}, Lighting: ${activeScene.lighting}. Characters: ${charDescriptions}. Action & Dialogue: ${activeScene.script.replace(/\s+/g, ' ').slice(0, 500)}`;

    try {
      setVideoProgress(22);
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          aspectRatio: isWidescreen ? '16:9' : '16:9',
          duration: activeScene.videoClipDuration || '5s',
          resolution: activeScene.videoResolution || '720p',
          previousInteractionId: extend ? activeScene.lastInteractionId : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.videoDataUrl) {
          setVideoProgress(100);
          updateActiveScene({
            videoUrl: data.videoDataUrl,
            videoSource: extend ? 'Veo 3 Extended (+5s)' : 'Veo 3 Realistic Engine',
            lastInteractionId: data.interactionId
          });
          setIsRenderingScene(false);
          setIsPlaying(true);
          showToast(
            extend
              ? `Scene ${currentSceneIndex + 1} extended (+5s) with Veo 3`
              : `Scene ${currentSceneIndex + 1} rendered with Veo 3 Realistic Engine`
          );
          return;
        }
      }
    } catch {
      // Fallback to local realistic cinema WebM synthesizer
    }

    try {
      const blobUrl = await synthesizeRealisticSceneVideo(
        activeScene,
        cast,
        isWidescreen,
        (pct) => setVideoProgress(pct)
      );
      updateActiveScene({
        videoUrl: blobUrl,
        videoSource: extend
          ? 'Veo 3 Realistic Synth (+Extended)'
          : 'Veo 3 Realistic Cinema Stream'
      });
      setIsPlaying(true);
      showToast(`Scene ${currentSceneIndex + 1} realistic video rendered & loaded in player`);
    } catch {
      showToast('Video render encountered an issue');
    } finally {
      setIsRenderingScene(false);
      setVideoProgress(0);
    }
  };

  // Generate / Render Scene button handler
  const handleGenerateScene = () => {
    handleGenerateVeoVideo(false);
  };

  // Table Read toggle
  const handleToggleTableRead = () => {
    if (isTableReading) {
      studioAudio.stopTableRead();
      setIsTableReading(false);
      setActiveSpeaker(null);
      setActiveSubtitle(null);
      showToast('Stopped scene table read');
      return;
    }

    setIsTableReading(true);
    showToast(`Starting voice table read for Scene ${currentSceneIndex + 1}`);
    studioAudio.runSceneTableRead(activeScene.script, cast, (speaker, line) => {
      setActiveSpeaker(speaker);
      setActiveSubtitle(line);
      if (!speaker && !line) {
        setIsTableReading(false);
      }
    });
  };

  // Cast Lock / Unlock handlers
  const handleToggleSingleLock = (charId: string, type: 'face' | 'voice') => {
    setCast((prev) =>
      prev.map((c) => {
        if (c.id !== charId) return c;
        const nextVal = type === 'face' ? !c.faceLocked : !c.voiceLocked;
        showToast(
          `@${c.name} ${type === 'face' ? 'Face Seed' : 'Voice Clone'} ${
            nextVal ? 'Locked' : 'Unlocked for editing'
          }`
        );
        return type === 'face' ? { ...c, faceLocked: nextVal } : { ...c, voiceLocked: nextVal };
      })
    );
  };

  const anyCastLocked = cast.some((c) => c.faceLocked || c.voiceLocked);

  // Calculate Screen Time percentage & script appearance metrics for each character across all scenes
  const castScreenTime = React.useMemo(() => {
    const rawStats = cast.map((c) => {
      const escaped = c.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!escaped) {
        return { id: c.id, mentions: 0, scenesCount: 0, weightedScore: 0 };
      }
      const regex = new RegExp(`(?:@${escaped}|\\b${escaped}\\b)`, 'gi');
      let mentions = 0;
      let scenesCount = 0;
      let weightedScore = 0;

      scenes.forEach((scene) => {
        const matches = scene.script.match(regex);
        const count = matches ? matches.length : 0;
        if (count > 0) {
          mentions += count;
          scenesCount += 1;
          weightedScore += count * Math.max(10, scene.durationSec || 30);
        }
      });

      return { id: c.id, mentions, scenesCount, weightedScore };
    });

    const totalMentions = rawStats.reduce((acc, item) => acc + item.mentions, 0);

    const record: Record<
      string,
      { percentage: number; mentions: number; scenesCount: number }
    > = {};

    rawStats.forEach((item) => {
      const percentage =
        totalMentions > 0 ? Math.round((item.mentions / totalMentions) * 100) : 0;
      record[item.id] = {
        percentage,
        mentions: item.mentions,
        scenesCount: item.scenesCount
      };
    });

    return record;
  }, [cast, scenes]);

  const handleToggleAllCastLocks = () => {
    const lockAll = !anyCastLocked;
    setCast((prev) =>
      prev.map((c) => ({
        ...c,
        faceLocked: lockAll,
        voiceLocked: lockAll
      }))
    );
    showToast(
      lockAll
        ? 'Locked all cast face seeds & voice clones'
        : 'Unlocked all cast faces & voices for editing'
    );
  };

  const handleSaveCharacter = (char: CastMember, isNew: boolean) => {
    if (isNew) {
      setCast((prev) => [...prev, char]);
      showToast(`Added @${char.name} to Cast & Script`);
    } else {
      setCast((prev) => prev.map((c) => (c.id === char.id ? char : c)));
      showToast(`Updated @${char.name}'s face & voice profile`);
    }
    setIsCastModalOpen(false);
  };

  const handleDeleteCharacter = (charId: string) => {
    const target = cast.find((c) => c.id === charId);
    setCast((prev) => prev.filter((c) => c.id !== charId));
    setIsCastModalOpen(false);
    if (target) showToast(`Removed @${target.name} from cast`);
  };

  // Assign a recorded microphone take to a character
  const handleAssignTakeToCharacter = (charId: string, take: VoiceTake) => {
    setCast((prev) =>
      prev.map((c) =>
        c.id === charId
          ? {
              ...c,
              customTakeUrl: take.audioUrl,
              customTakeLabel: `${take.source} (${take.durationSec}s)`
            }
          : c
      )
    );
  };

  // Timeline Scene operations
  const handleAddScene = () => {
    const newId = Date.now();
    const nextNum = scenes.length + 1;
    const newScene: SceneShot = {
      id: newId,
      title: `Sector 0${nextNum} Recon`,
      slugline: `EXT. NEO-TOKYO SECTOR 0${nextNum} - NIGHT`,
      script: `EXT. NEO-TOKYO SECTOR 0${nextNum} - NIGHT\n\nRain-slicked concrete reflects the amber warning beacons overhead.\n\n@${
        cast[0]?.name || 'Elena'
      } advances along the catwalk, scanning the perimeter.`,
      camera: 'CAMERA: Static Anamorphic Wide [1.0x]',
      lens: '35mm Anamorphic · T2.0',
      lighting: 'High-contrast cyan & amber sodium cross-lighting',
      foleyNote: 'Metallic footsteps on wet grating, distant siren echo',
      durationSec: 40,
      tensionLevel: 70,
      style: 'cyberpunk'
    };
    setScenes((prev) => [...prev, newScene]);
    setCurrentSceneIndex(scenes.length);
    showToast(`Added Scene ${nextNum}`);
  };

  const handleDuplicateScene = (idx: number) => {
    const source = scenes[idx];
    if (!source) return;
    const copy: SceneShot = {
      ...source,
      id: Date.now(),
      title: `${source.title} (Alt Take)`
    };
    const next = [...scenes];
    next.splice(idx + 1, 0, copy);
    setScenes(next);
    setCurrentSceneIndex(idx + 1);
    showToast(`Duplicated Shot ${idx + 1}`);
  };

  const handleDeleteScene = (idx: number) => {
    if (scenes.length <= 1) return;
    const next = scenes.filter((_, i) => i !== idx);
    setScenes(next);
    setCurrentSceneIndex(Math.max(0, Math.min(currentSceneIndex, next.length - 1)));
    showToast(`Removed Shot ${idx + 1}`);
  };

  // Adapt Beat Sheet item directly into a new Scene Shot
  const handleAdaptBeatToScene = (beat: StoryBeat) => {
    const newScene: SceneShot = {
      id: Date.now(),
      title: beat.beatName.replace(/^\d+\.\s*/, ''),
      slugline: `INT./EXT. ${beat.beatName.replace(/^\d+\.\s*/, '').toUpperCase()} - NIGHT`,
      script: `INT./EXT. ${beat.beatName.replace(/^\d+\.\s*/, '').toUpperCase()} - NIGHT\n\n[VISUAL MOTIF: ${
        beat.visualMotif
      }]\n\n${beat.sequenceSummary}\n\n[SUBTEXT GOAL: ${beat.subtextGoal}]`,
      camera: 'CAMERA: Slow Dolly In [1.0x]',
      lens: '35mm Anamorphic · T2.0',
      lighting: beat.visualMotif,
      foleyNote: 'Atmospheric tension drone, sharp diegetic movement',
      durationSec: 45,
      tensionLevel: beat.tension,
      style: 'cyberpunk'
    };
    setScenes((prev) => [...prev, newScene]);
    setCurrentSceneIndex(scenes.length);
    setActiveTab('script');
    showToast(`Adapted "${beat.beatName}" into Scene ${scenes.length + 1}`);
  };

  // Studio Audio Mix handlers
  const getAtmosVolumes = (tracks: AudioTrackMix[]) => {
    const findVol = (t: AudioTrackMix['synthType']) => {
      const found = tracks.find((x) => x.synthType === t);
      return found && !found.muted ? found.volume : 0;
    };
    return {
      rain: findVol('rain'),
      hum: findVol('hum'),
      pulse: findVol('pulse')
    };
  };

  const handleToggleLiveAtmos = () => {
    const vols = getAtmosVolumes(audioTracks);
    const active = studioAudio.toggleAtmosGenerator(vols);
    setIsAtmosLive(active);
    showToast(
      active ? 'Live Studio Atmos Synthesizer active' : 'Muted Studio Atmos Synthesizer'
    );
  };

  const handleTrackVolumeChange = (id: string, volume: number) => {
    const updated = audioTracks.map((t) => (t.id === id ? { ...t, volume } : t));
    setAudioTracks(updated);
    if (isAtmosLive) {
      studioAudio.updateAtmosVolumes(getAtmosVolumes(updated), isTableReading && autoDuckDialogue);
    }
  };

  // Download Screenplay & Production Bible (.txt / .fountain)
  const handleDownloadScreenplay = () => {
    const content = [
      `TITLE: STORYCAST AI PRODUCTION SCRIPT`,
      `LOGLINE: ${logline}`,
      `DATE: ${new Date().toISOString().slice(0, 10)}`,
      ``,
      `================================================================`,
      `CAST & VOICE SYNTHESIS BIBLE`,
      `================================================================`,
      ...cast.map(
        (c) =>
          `@${c.name.toUpperCase()} (${c.role} · ${c.archetype})\n  Face Seed (${
            c.faceLocked ? 'LOCKED' : 'UNLOCKED'
          }): ${c.facePrompt}\n  Voice Profile (${
            c.voiceLocked ? 'LOCKED' : 'UNLOCKED'
          }): ${c.voiceModel} · ${c.voiceStyle} [Pitch ${c.pitch}x / Speed ${c.speed}x]`
      ),
      ``,
      `================================================================`,
      `SEQUENCED SHOOTING SCRIPT & SHOT LIST`,
      `================================================================`,
      ...scenes.map(
        (s, i) =>
          `\n--- SCENE ${i + 1}: ${s.title.toUpperCase()} (${s.durationSec}s · Style: ${s.style.toUpperCase()}) ---\n${
            s.camera
          } | Lens: ${s.lens}\nLighting: ${s.lighting}\nFoley: ${s.foleyNote}\n\n${s.script}\n`
      )
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storycast-production-script.fountain.txt';
    a.click();
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
    showToast('Downloaded Production Script & Shot Bible');
  };

  // Render Full-Screen Splash Landing Page if viewMode === 'splash'
  if (viewMode === 'splash') {
    return (
      <SplashLanding
        onStartNewScene={handleStartCreatingFromSplash}
        onEnterExistingStudio={() => {
          setViewMode('studio');
          showToast('Entered STORYCAST AI Production Studio');
        }}
        castCount={cast.length}
        sceneCount={scenes.length}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <OfflineIndicator />
      {/* Toast Notification */}
      <div
        aria-live="polite"
        className={`fixed top-4 right-4 z-50 transform transition-all duration-200 bg-slate-900 border border-cyan-500/50 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium pointer-events-none ${
          toastMsg ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
        }`}
      >
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>{toastMsg || 'Action completed'}</span>
      </div>

      {/* 1. TOP BAR CONTRACT (3 Zones: Branded Wordmark — 5 Nav Links — 1 Primary Action) */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Single text element wordmark with cyan-to-amber styling */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('script');
            }}
            className="font-display font-extrabold tracking-tight text-base sm:text-lg whitespace-nowrap shrink-0 bg-gradient-to-r from-cyan-400 via-cyan-200 to-amber-400 bg-clip-text text-transparent"
          >
            STORYCAST AI
          </a>

          {/* Zone 2: Concise single-line text navigation links */}
          <nav
            aria-label="Primary Workspace Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveTab('script')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'script'
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-400 border-transparent hover:text-slate-100'
              }`}
            >
              Screenplay
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cast')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'cast'
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-400 border-transparent hover:text-slate-100'
              }`}
            >
              Cast &amp; Voices ({cast.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('director')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'director'
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-400 border-transparent hover:text-slate-100'
              }`}
            >
              Beats &amp; Blocking
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'audio'
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-400 border-transparent hover:text-slate-100'
              }`}
            >
              Studio Mic &amp; Audio
            </button>
            <button
              type="button"
              onClick={() => setViewMode('splash')}
              className="text-slate-400 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent"
            >
              Showcase Poster
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center gap-2 transition active:scale-95 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4 stroke-[2.25]" />
              <span>Export Script</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Container */}
      <main className="max-w-[1380px] w-full mx-auto px-3.5 sm:px-6 py-5 flex-1 flex flex-col gap-5">
        {/* Studio Brand Banner Strip with Branded Clapperboard Icon & Cyan-to-Amber Headline */}
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Clapperboard className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-display font-bold tracking-wide uppercase bg-gradient-to-r from-cyan-400 via-slate-100 to-amber-400 bg-clip-text text-transparent">
                WRITE, CAST, &amp; GENERATE YOUR MOVIE
              </div>
              <div className="text-[11px] text-slate-400">
                Scene {currentSceneIndex + 1} of {scenes.length} · {cast.length} Cast Profiles ·{' '}
                {voiceTakes.length} Voice Takes
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton variant="header" />
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Character Line</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('splash')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
            >
              Poster View
            </button>
          </div>
        </div>

        {/* Interactive Workspace Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Studio Workspace Modes"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#0d1322] p-1.5 rounded-xl border border-slate-800/90"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'script'}
            onClick={() => setActiveTab('script')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === 'script'
                ? 'bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Script &amp; Editor</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cast'}
            onClick={() => setActiveTab('cast')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === 'cast'
                ? 'bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Cast &amp; Characters · {cast.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'director'}
            onClick={() => setActiveTab('director')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === 'director'
                ? 'bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Beats &amp; Shot Vision</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'audio'}
            onClick={() => setActiveTab('audio')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === 'audio'
                ? 'bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Mic className="w-4 h-4 shrink-0" />
            <span>Mic &amp; Audio Mix</span>
          </button>
        </div>

        {/* MAIN 12-COLUMN STUDIO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ACTIVE WORKSPACE PANEL (7 Cols on Desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* TAB 1: SCRIPT & SCREENPLAY VIEW */}
            {activeTab === 'script' && (
              <section className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-5">
                {/* Character Quick-Tags Bar (Dynamically synced with Cast) */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium flex items-center gap-1.5 text-slate-200">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Tag Character to Scene</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cast')}
                      className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40 font-medium transition whitespace-nowrap shrink-0"
                    >
                      + Edit / Add Cast ({cast.length})
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cast.map((c) => {
                      const st = COLOR_STYLES[c.color] || COLOR_STYLES.cyan;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            insertAtEndOrCursor(`@${c.name}`, `Tagged @${c.name} in script`)
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-xs font-mono flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap shrink-0"
                        >
                          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                          <span className="text-slate-100 font-medium">@{c.name}</span>
                          <span className="text-slate-400">· {c.role}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Industry Standard Screenplay Formatting Bar + AI Auto-Complete */}
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Screenplay Elements &amp; Narrative Assist</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Present-tense visual prose · Standard sluglines
                    </span>
                  </div>

                  {/* Quick Screenplay Grammar Strip */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertFormattingElement('slugline')}
                      className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-slate-300 transition whitespace-nowrap shrink-0"
                    >
                      + SLUGLINE
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormattingElement('action')}
                      className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-slate-300 transition whitespace-nowrap shrink-0"
                    >
                      + VISUAL ACTION
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormattingElement('character')}
                      className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-slate-300 transition whitespace-nowrap shrink-0"
                    >
                      + CHARACTER CUE
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormattingElement('parenthetical')}
                      className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-slate-300 transition whitespace-nowrap shrink-0"
                    >
                      + (PARENTHETICAL)
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormattingElement('foley')}
                      className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-slate-300 transition whitespace-nowrap shrink-0"
                    >
                      + FOLEY CUE
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormattingElement('transition')}
                      className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-slate-300 transition whitespace-nowrap shrink-0"
                    >
                      + CUT TO:
                    </button>
                  </div>

                  {/* 3 Primary Narrative Auto-Complete Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAiInsert('dialogue')}
                      className="py-2 px-3 rounded-lg bg-purple-950/35 hover:bg-purple-900/45 border border-purple-700/50 text-purple-200 text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-95 whitespace-nowrap shrink-0"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>+ Subtext Dialogue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAiInsert('prompt')}
                      className="py-2 px-3 rounded-lg bg-amber-950/35 hover:bg-amber-900/45 border border-amber-700/50 text-amber-200 text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-95 whitespace-nowrap shrink-0"
                    >
                      <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>+ Scene Prompt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAiInsert('beat')}
                      className="py-2 px-3 rounded-lg bg-emerald-950/35 hover:bg-emerald-900/45 border border-emerald-700/50 text-emerald-200 text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-95 whitespace-nowrap shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>+ Continue Beat</span>
                    </button>
                  </div>
                </div>

                {/* Scene Title & Slugline Quick Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Scene Title
                    </label>
                    <input
                      type="text"
                      value={activeScene.title}
                      onChange={(e) => updateActiveScene({ title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Master Slugline (INT./EXT. LOCATION - TIME)
                    </label>
                    <input
                      type="text"
                      value={activeScene.slugline}
                      onChange={(e) => updateActiveScene({ slugline: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Screenplay Editor / Formatted Page View */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tracking-wider text-slate-300 uppercase font-mono">
                        Screenplay Editor
                      </span>
                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setScriptSubMode('editor')}
                          className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition ${
                            scriptSubMode === 'editor'
                              ? 'bg-slate-800 text-cyan-300 font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Write</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setScriptSubMode('formatted')}
                          className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition ${
                            scriptSubMode === 'formatted'
                              ? 'bg-slate-800 text-cyan-300 font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>Page View</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-slate-400 tabular-nums">
                      <span>
                        {wordCount} words · {charCount} chars · ~{estPages} pg
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateActiveScene({ script: '' });
                          showToast('Script cleared');
                        }}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {scriptSubMode === 'editor' ? (
                    <textarea
                      ref={scriptTextareaRef}
                      rows={8}
                      value={activeScene.script}
                      onChange={(e) => updateActiveScene({ script: e.target.value })}
                      placeholder="Write lean, present-tense visual action lines, sluglines, or @Character dialogue..."
                      className="w-full rounded-xl bg-slate-950/90 border border-slate-800 focus:border-cyan-500/60 focus:outline-none p-4 text-sm text-slate-100 leading-relaxed resize-y font-mono"
                    />
                  ) : (
                    <div className="w-full min-h-[210px] rounded-xl bg-slate-950 border border-slate-800 p-5 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed flex flex-col gap-2">
                      {activeScene.script.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={i} className="h-2" />;
                        if (
                          trimmed.startsWith('INT.') ||
                          trimmed.startsWith('EXT.') ||
                          trimmed.endsWith('CUT TO:')
                        ) {
                          return (
                            <div
                              key={i}
                              className="font-bold text-cyan-400 uppercase tracking-wide pt-1"
                            >
                              {trimmed}
                            </div>
                          );
                        }
                        if (/^@[A-Za-z0-9_-]+$/.test(trimmed)) {
                          return (
                            <div
                              key={i}
                              className="text-center font-bold text-amber-300 uppercase mt-2"
                            >
                              {trimmed}
                            </div>
                          );
                        }
                        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                          return (
                            <div key={i} className="text-center italic text-slate-400 text-xs">
                              {trimmed}
                            </div>
                          );
                        }
                        if (trimmed.startsWith('[')) {
                          return (
                            <div key={i} className="text-emerald-400 text-xs">
                              {trimmed}
                            </div>
                          );
                        }
                        if (trimmed.startsWith('"') || trimmed.startsWith('“')) {
                          return (
                            <div key={i} className="max-w-md mx-auto text-center text-slate-100">
                              {trimmed}
                            </div>
                          );
                        }
                        return (
                          <div key={i} className="text-slate-300">
                            {trimmed}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Primary CTA Button */}
                <button
                  type="button"
                  onClick={handleGenerateScene}
                  disabled={isRenderingScene}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-950 text-sm tracking-wide uppercase bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 hover:opacity-95 transition shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {isRenderingScene ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Syncing Shot &amp; Blocking to Viewport...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                      <span>Generate Video Scene</span>
                    </>
                  )}
                </button>
              </section>
            )}

            {/* TAB 2: CAST & CHARACTERS VIEW (Unlocked Face & Voice Editor + Mic Recording Link) */}
            {activeTab === 'cast' && (
              <section className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-cyan-400" />
                      <span>Cast Studio — Face &amp; Voice Unlocked</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Customize character faces, upload reference portraits, and tune or record voices
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleAllCastLocks}
                      className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border transition whitespace-nowrap shrink-0 ${
                        anyCastLocked
                          ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                          : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                      }`}
                    >
                      {anyCastLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Some Locked</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>All Unlocked</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCharacter(null);
                        setIsCastModalOpen(true);
                      }}
                      className="text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Character</span>
                    </button>
                  </div>
                </div>

                {/* Cast List */}
                <div className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
                  {cast.map((c) => {
                    const st = COLOR_STYLES[c.color] || COLOR_STYLES.cyan;
                    const screenStats = castScreenTime[c.id] || {
                      percentage: 0,
                      mentions: 0,
                      scenesCount: 0
                    };
                    return (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCharacter(c);
                                setIsCastModalOpen(true);
                              }}
                              title="Click to edit character face & voice"
                              className={`w-13 h-13 rounded-xl border ${st.box} flex items-center justify-center font-bold text-base overflow-hidden shrink-0 cursor-pointer relative group`}
                            >
                              {c.avatarUrl ? (
                                <img
                                  src={c.avatarUrl}
                                  alt={c.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{c.name.charAt(0).toUpperCase()}</span>
                              )}
                              <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Camera className="w-4 h-4 text-cyan-300" />
                              </div>
                            </button>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                <span className="text-sm font-bold text-white">@{c.name}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-cyan-400">{c.role}</span>
                                <span aria-hidden="true">·</span>
                                <span>{c.archetype}</span>
                                {c.customTakeLabel && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-amber-400 font-mono text-[11px]">
                                      Mic: {c.customTakeLabel}
                                    </span>
                                  </>
                                )}
                              </div>
                              <p
                                className="text-xs text-slate-300 line-clamp-1 mt-1"
                                title={c.facePrompt}
                              >
                                <span className="text-cyan-400 font-mono text-[11px]">Face: </span>
                                {c.facePrompt || 'Custom visual profile'}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                                <span className="text-amber-400 text-[11px]">Voice: </span>
                                {c.voiceModel} · {c.voiceStyle} · {c.pitch.toFixed(1)}x pitch /{' '}
                                {c.speed.toFixed(1)}x rate
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMicCharId(c.id);
                                setActiveTab('audio');
                                showToast(`Opened Studio Mic Recorder for @${c.name}`);
                              }}
                              title="Record Live Microphone Take"
                              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 transition"
                            >
                              <Mic className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (c.customTakeUrl) {
                                  const audio = new Audio(c.customTakeUrl);
                                  audio.play().catch(() => {});
                                  showToast(`Playing recorded mic take for @${c.name}`);
                                } else {
                                  studioAudio.speakCharacterSample(
                                    c.name,
                                    c.voiceModel,
                                    c.pitch,
                                    c.speed
                                  );
                                  showToast(
                                    `Playing @${c.name} (${c.voiceModel} · ${c.pitch.toFixed(1)}x)`
                                  );
                                }
                              }}
                              title="Audition Character Voice"
                              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 transition"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCharacter(c);
                                setIsCastModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center gap-1 transition whitespace-nowrap shrink-0"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>

                        {/* Visual Screen Time Bar based on Scene Script Appearances */}
                        <div className="flex flex-col gap-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                            <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Film className={`w-3 h-3 ${st.text}`} />
                              <span>Screen Time</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">
                                {screenStats.mentions}{' '}
                                {screenStats.mentions === 1 ? 'mention' : 'mentions'} ·{' '}
                                {screenStats.scenesCount}/{scenes.length}{' '}
                                {scenes.length === 1 ? 'scene' : 'scenes'}
                              </span>
                              <span className={`font-bold ${st.text}`}>
                                {screenStats.percentage}%
                              </span>
                            </div>
                          </div>
                          <svg
                            viewBox="0 0 100 6"
                            preserveAspectRatio="none"
                            className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800/90 overflow-hidden"
                            role="progressbar"
                            aria-valuenow={screenStats.percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${c.name} screen time ${screenStats.percentage}%`}
                          >
                            <rect
                              x="0"
                              y="0"
                              width={
                                screenStats.mentions > 0
                                  ? Math.max(4, screenStats.percentage)
                                  : 0
                              }
                              height="6"
                              rx="3"
                              className={`fill-current ${st.text} transition-all duration-300`}
                            />
                          </svg>
                        </div>

                        {/* Quick Inline Face & Voice Lock/Unlock Strip */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleSingleLock(c.id, 'face')}
                              className={`px-2 py-0.5 rounded flex items-center gap-1 border transition whitespace-nowrap shrink-0 ${
                                c.faceLocked
                                  ? 'bg-slate-900 border-slate-700 text-slate-400'
                                  : 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                              }`}
                            >
                              {c.faceLocked ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Unlock className="w-3 h-3" />
                              )}
                              <span>Face {c.faceLocked ? 'Locked' : 'Unlocked'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSingleLock(c.id, 'voice')}
                              className={`px-2 py-0.5 rounded flex items-center gap-1 border transition whitespace-nowrap shrink-0 ${
                                c.voiceLocked
                                  ? 'bg-slate-900 border-slate-700 text-slate-400'
                                  : 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                              }`}
                            >
                              {c.voiceLocked ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Unlock className="w-3 h-3" />
                              )}
                              <span>Voice {c.voiceLocked ? 'Locked' : 'Unlocked'}</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              insertAtEndOrCursor(`@${c.name}`, `Tagged @${c.name} in script`);
                              setActiveTab('script');
                            }}
                            className="text-slate-400 hover:text-cyan-400 font-mono transition whitespace-nowrap shrink-0"
                          >
                            + Insert @{c.name} in Script →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TAB 3: DIRECTOR'S BEAT SHEET, LOGLINE & SHOT VISION */}
            {activeTab === 'director' && (
              <section className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-5">
                {/* Project Logline */}
                <div className="flex flex-col gap-2 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-cyan-400" />
                      <span>Series Logline &amp; Narrative Spine</span>
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      Cinematic Structure &amp; Pacing
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={logline}
                    onChange={(e) => setLogline(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/60 p-3 text-xs sm:text-sm text-slate-200 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Active Scene Production & Directorial Vision Inspector */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-cyan-400 font-semibold">
                      Active Shot Directorial Spec — Scene {currentSceneIndex + 1}
                    </span>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      Tension {activeScene.tensionLevel}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                        Lens &amp; Framing
                      </label>
                      <input
                        type="text"
                        value={activeScene.lens}
                        onChange={(e) => updateActiveScene({ lens: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                        Scene Tension Pace ({activeScene.tensionLevel}%)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={activeScene.tensionLevel}
                        onChange={(e) =>
                          updateActiveScene({ tensionLevel: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-cyan-400 cursor-pointer mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                        Lighting Tone &amp; Visual Motif
                      </label>
                      <input
                        type="text"
                        value={activeScene.lighting}
                        onChange={(e) => updateActiveScene({ lighting: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                        Diegetic Foley &amp; Sound Design Cue
                      </label>
                      <input
                        type="text"
                        value={activeScene.foleyNote}
                        onChange={(e) => updateActiveScene({ foleyNote: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Sequence Beat Sheet */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      Sequence Beat Sheet ({beats.length} Beats)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx = beats.length + 1;
                        setBeats((prev) => [
                          ...prev,
                          {
                            id: `beat-${Date.now()}`,
                            act: 'ACT III · RESOLUTION',
                            beatName: `0${nextIdx}. Dawn Over Sector Zero`,
                            sequenceSummary:
                              '@Elena and @Leo broadcast the decrypted archive across every billboard in Neo-Tokyo.',
                            visualMotif: 'Warm golden sunrise breaking through cyan smog',
                            subtextGoal: 'Catharsis and systemic reckoning.',
                            tension: 75
                          }
                        ]);
                        showToast('Added new narrative beat to sheet');
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Beat</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {beats.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-cyan-400">{b.act}</span>
                            <span aria-hidden="true" className="text-slate-600">
                              ·
                            </span>
                            <span className="font-semibold text-white">{b.beatName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                              Tension {b.tension}%
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdaptBeatToScene(b)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 text-[11px] font-medium transition whitespace-nowrap shrink-0"
                            >
                              Adapt to Scene →
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {b.sequenceSummary}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span>Motif: {b.visualMotif}</span>
                          <span aria-hidden="true">·</span>
                          <span>Subtext: {b.subtextGoal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* TAB 4: LIVE STUDIO MICROPHONE RECORDER & AUDIO MIX */}
            {activeTab === 'audio' && (
              <section className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-5">
                {/* 1. Live Studio Microphone Voice Recorder (from Poster) */}
                <StudioMicRecorder
                  cast={cast}
                  selectedCharId={selectedMicCharId}
                  onSelectCharId={setSelectedMicCharId}
                  currentSceneId={activeScene.id}
                  currentSceneTitle={`Scene ${currentSceneIndex + 1}: ${activeScene.title}`}
                  voiceTakes={voiceTakes}
                  onAddVoiceTake={(take) => setVoiceTakes((prev) => [take, ...prev])}
                  onDeleteVoiceTake={(takeId) => {
                    setVoiceTakes((prev) => prev.filter((t) => t.id !== takeId));
                    showToast('Removed voice take');
                  }}
                  onAssignTakeToCharacter={handleAssignTakeToCharacter}
                  onToast={showToast}
                />

                {/* 2. Atmospheric Soundscape & Foley Mixer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 pt-1">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">
                      Studio Atmospheric &amp; Foley Mix
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Real-time Web Audio atmospheric stems, foley levels, and dialogue auto-ducking
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleLiveAtmos}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition whitespace-nowrap shrink-0 ${
                      isAtmosLive
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-500/50'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>{isAtmosLive ? 'Stop Live Atmos Synth' : 'Preview Live Atmos Mix'}</span>
                  </button>
                </div>

                {/* Audio Stems */}
                <div className="flex flex-col gap-3">
                  {audioTracks.map((track) => (
                    <div
                      key={track.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{track.name}</span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs font-mono text-cyan-400">{track.category}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{track.description}</div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-slate-300 w-10 text-right tabular-nums">
                          {track.volume}%
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={track.volume}
                          onChange={(e) =>
                            handleTrackVolumeChange(track.id, parseInt(e.target.value, 10))
                          }
                          aria-label={track.name}
                          className="w-32 accent-cyan-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Auto-Duck Music on Dialogue Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Auto-Duck Atmos on Character Dialogue
                      </div>
                      <div className="text-xs text-slate-400">
                        Automatically attenuates rain &amp; synth score by -9dB when characters
                        speak
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoDuckDialogue(!autoDuckDialogue);
                        showToast(
                          `Auto-Duck on Dialogue ${!autoDuckDialogue ? 'Enabled' : 'Disabled'}`
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition whitespace-nowrap shrink-0 ${
                        autoDuckDialogue
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {autoDuckDialogue ? 'ACTIVE' : 'BYPASSED'}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: VIDEO PREVIEW & SEQUENCED TIMELINE (5 Cols on Desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <CinemaViewport
              scenes={scenes}
              currentSceneIndex={currentSceneIndex}
              cast={cast}
              isPlaying={isPlaying}
              isLooping={isLooping}
              isWidescreen={isWidescreen}
              activeSpeaker={activeSpeaker}
              activeSubtitle={activeSubtitle}
              isTableReading={isTableReading}
              onSelectScene={(idx) => {
                setCurrentSceneIndex(idx);
                if (isTableReading) {
                  studioAudio.stopTableRead();
                  setIsTableReading(false);
                  setActiveSpeaker(null);
                  setActiveSubtitle(null);
                }
              }}
              onAddScene={handleAddScene}
              onDuplicateScene={handleDuplicateScene}
              onDeleteScene={handleDeleteScene}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onToggleLoop={() => {
                setIsLooping(!isLooping);
                showToast(`Timeline Loop ${!isLooping ? 'Enabled' : 'Disabled'}`);
              }}
              onToggleAspect={() => {
                setIsWidescreen(!isWidescreen);
                showToast(
                  `Aspect ratio set to ${!isWidescreen ? '2.39:1 Anamorphic' : '16:9 HD'}`
                );
              }}
              onChangeStyle={(style: VisualStyle) => {
                updateActiveScene({ style });
                showToast(`Visual style set to ${style.toUpperCase()}`);
              }}
              onChangeCamera={(camera: string) => {
                updateActiveScene({ camera });
                showToast(`Updated camera directive`);
              }}
              onToggleTableRead={handleToggleTableRead}
              isGeneratingVideo={isRenderingScene}
              videoProgress={videoProgress}
              onGenerateVeoVideo={handleGenerateVeoVideo}
              onUpdateSceneVideoConfig={updateActiveScene}
              onUploadSceneVideo={(url) => {
                updateActiveScene({
                  videoUrl: url,
                  videoSource: 'Uploaded MP4/WebM Master'
                });
                showToast('Loaded custom scene video into player');
              }}
            />
          </div>
        </div>
      </main>

      {/* MODAL: ADD OR EDIT CHARACTER (FACE & VOICE) */}
      <CastModal
        isOpen={isCastModalOpen}
        editingCharacter={editingCharacter}
        onClose={() => setIsCastModalOpen(false)}
        onSave={handleSaveCharacter}
        onDelete={handleDeleteCharacter}
        onToast={showToast}
      />

      {/* MODAL: EXPORT PRODUCTION PACKAGE */}
      {isExportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0d1322] border border-slate-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Export Studio Production Package</h3>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ESC
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed flex flex-col gap-2">
              <p>
                Your production bundle includes all {scenes.length} sequenced shooting scenes,
                camera &amp; lens directives, and the {cast.length}-character Face &amp; Voice
                Bible.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 flex flex-col gap-1 tabular-nums">
                <div>· Scenes: {scenes.length} sequenced shots</div>
                <div>· Cast Profiles: {cast.map((c) => `@${c.name}`).join(', ')}</div>
                <div>· Voice Takes: {voiceTakes.length} recorded/synthesized lines</div>
                <div>· Aspect Ratio: {isWidescreen ? '2.39:1 Anamorphic Scope' : '16:9 HD'}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadScreenplay}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Download .Fountain Script</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
