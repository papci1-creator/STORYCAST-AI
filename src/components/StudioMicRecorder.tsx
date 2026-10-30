import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Trash2,
  CheckCircle2,
  Volume2,
  Sparkles
} from 'lucide-react';
import { CastMember, VoiceTake } from '../types/studio';
import { studioAudio } from '../utils/audioEngine';

interface StudioMicRecorderProps {
  cast: CastMember[];
  selectedCharId: string;
  onSelectCharId: (id: string) => void;
  currentSceneId: number;
  currentSceneTitle: string;
  voiceTakes: VoiceTake[];
  onAddVoiceTake: (take: VoiceTake) => void;
  onDeleteVoiceTake: (takeId: string) => void;
  onAssignTakeToCharacter: (charId: string, take: VoiceTake) => void;
  onToast: (msg: string) => void;
}

export const StudioMicRecorder: React.FC<StudioMicRecorderProps> = ({
  cast,
  selectedCharId,
  onSelectCharId,
  currentSceneId,
  currentSceneTitle,
  voiceTakes,
  onAddVoiceTake,
  onDeleteVoiceTake,
  onAssignTakeToCharacter,
  onToast
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [linePrompt, setLinePrompt] = useState(
    'The signal is coming from beneath the reactor core. Stay sharp.'
  );
  const [playingTakeId, setPlayingTakeId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const animRef = useRef<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const activeChar = cast.find((c) => c.id === selectedCharId) || cast[0];

  // Dual-Wave Cyan/Magenta & Amber/Cyan Waveform Visualizer (matching poster's right monitor)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const dataArray = new Uint8Array(64);

    const draw = () => {
      phase += 0.08;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dark studio monitor backdrop
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, w, h);

      // Subtle horizontal reference lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.28);
      ctx.lineTo(w, h * 0.28);
      ctx.moveTo(0, h * 0.72);
      ctx.lineTo(w, h * 0.72);
      ctx.stroke();

      if (analyserRef.current && isRecording) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      const barCount = 56;
      const barWidth = Math.max(2, (w - barCount * 2) / barCount);

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2) + 4;
        let norm = 0.12;

        if (isRecording && analyserRef.current) {
          const val = dataArray[i % dataArray.length] || 0;
          norm = Math.max(0.1, val / 255);
        } else if (isRecording) {
          // Simulated live mic modulation when running in fallback mode
          norm =
            0.2 +
            0.65 *
              Math.abs(Math.sin(phase + i * 0.28) * Math.cos(phase * 0.7 - i * 0.15));
        } else if (playingTakeId) {
          norm =
            0.18 +
            0.55 * Math.abs(Math.sin(phase * 1.2 + i * 0.35) * Math.sin(phase * 0.5 + i * 0.2));
        } else {
          // Idle studio waveform signature matching poster
          norm =
            0.08 +
            0.22 *
              Math.abs(Math.sin(i * 0.32 + phase * 0.25) * Math.cos(i * 0.18));
        }

        // Top Track: Cyan to Magenta Gradient (Character Input Track)
        const topMaxH = h * 0.38;
        const barH1 = Math.max(3, norm * topMaxH);
        const y1 = h * 0.28 - barH1 / 2;
        const ratio = i / barCount;
        ctx.fillStyle =
          ratio > 0.35 && ratio < 0.75 ? '#ec4899' : '#22d3ee';
        ctx.fillRect(x, y1, barWidth, barH1);

        // Bottom Track: Amber to Cyan Gradient (Master Synced Track)
        const botMaxH = h * 0.36;
        const barH2 = Math.max(3, norm * 0.85 * botMaxH);
        const y2 = h * 0.72 - barH2 / 2;
        ctx.fillStyle =
          ratio > 0.25 && ratio < 0.65 ? '#f59e0b' : '#06b6d4';
        ctx.fillRect(x, y2, barWidth, barH2);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRecording, playingTakeId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    if (!activeChar) return;
    setElapsedSec(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const finalDuration = Math.max(1.2, Math.round(elapsedSec * 10) / 10);
        const newTake: VoiceTake = {
          id: `take-${Date.now()}`,
          characterId: activeChar.id,
          characterName: activeChar.name,
          sceneId: currentSceneId,
          lineText: linePrompt.trim() || `Voice take for @${activeChar.name}`,
          durationSec: finalDuration,
          audioUrl: url,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'Microphone'
        };
        onAddVoiceTake(newTake);
        onAssignTakeToCharacter(activeChar.id, newTake);
        onToast(`Saved live microphone take for @${activeChar.name}`);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedSec((Date.now() - startTime) / 1000);
      }, 100);
      onToast(`Recording studio mic for @${activeChar.name}...`);
    } catch {
      // Graceful fallback when microphone permission is denied or blocked by iframe policy
      setIsRecording(true);
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedSec((Date.now() - startTime) / 1000);
      }, 100);
      onToast(
        `Recording simulated studio take for @${activeChar.name} (hardware mic unavailable)`
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else if (activeChar) {
      // Fallback simulated studio take completion
      const finalDuration = Math.max(1.8, Math.round(elapsedSec * 10) / 10);
      const newTake: VoiceTake = {
        id: `take-${Date.now()}`,
        characterId: activeChar.id,
        characterName: activeChar.name,
        sceneId: currentSceneId,
        lineText: linePrompt.trim() || `Voice take for @${activeChar.name}`,
        durationSec: finalDuration,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'Studio Synth'
      };
      onAddVoiceTake(newTake);
      onAssignTakeToCharacter(activeChar.id, newTake);
      onToast(`Saved studio voice take for @${activeChar.name}`);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    setIsRecording(false);
  };

  const handlePlayTake = (take: VoiceTake) => {
    if (playingTakeId === take.id) {
      audioPlayerRef.current?.pause();
      studioAudio.stopTableRead();
      setPlayingTakeId(null);
      return;
    }

    const char = cast.find((c) => c.id === take.characterId);
    setPlayingTakeId(take.id);

    if (take.audioUrl) {
      const audio = new Audio(take.audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setPlayingTakeId(null);
      audio.onerror = () => setPlayingTakeId(null);
      audio.play().catch(() => setPlayingTakeId(null));
      onToast(`Playing recorded mic take for @${take.characterName}`);
    } else {
      studioAudio.speakCharacterSample(
        take.characterName,
        char?.voiceModel || 'Nova',
        char?.pitch || 1.0,
        char?.speed || 1.0,
        take.lineText,
        () => setPlayingTakeId(null)
      );
      onToast(`Playing synthesized take for @${take.characterName}`);
    }
  };

  return (
    <div className="bg-slate-950/90 border border-cyan-500/35 rounded-2xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
              Studio Condenser Mic — Live Character Voice Recorder
            </h3>
            <p className="text-[11px] text-slate-400">
              Record real dialogue lines for any character &amp; sync to {currentSceneTitle}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-amber-400 tabular-nums">
          {isRecording ? `REC ● ${elapsedSec.toFixed(1)}s` : `${voiceTakes.length} Saved Takes`}
        </span>
      </div>

      {/* Character Selector & Dialogue Prompt Input */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-4">
          <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
            Target Character
          </label>
          <select
            value={activeChar?.id || ''}
            onChange={(e) => onSelectCharId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-medium"
          >
            {cast.map((c) => (
              <option key={c.id} value={c.id}>
                @{c.name} ({c.role} · {c.voiceModel.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-8">
          <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
            Dialogue Line Cue to Record / Synthesize
          </label>
          <input
            type="text"
            value={linePrompt}
            onChange={(e) => setLinePrompt(e.target.value)}
            placeholder="Enter the character's dialogue line to record..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Dual Cyan/Magenta & Amber Waveform Monitor (Inspired by Right Monitor in Poster) */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#050811]">
        <canvas
          ref={canvasRef}
          width={560}
          height={108}
          className="w-full h-[108px] block"
        />
        <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
          <span className="text-cyan-400">
            CH 01 · @{activeChar?.name.toUpperCase() || 'LEAD'} CONDENSER INPUT
          </span>
          <span className="text-pink-400">48kHz · 24-BIT STEREO WAVEFORM</span>
        </div>
      </div>

      {/* Record / Stop & Quick Synth Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition active:scale-95 whitespace-nowrap shrink-0"
            >
              <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Record Mic Take for @{activeChar?.name}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition whitespace-nowrap shrink-0"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop &amp; Save Take ({elapsedSec.toFixed(1)}s)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!activeChar) return;
              const newTake: VoiceTake = {
                id: `take-${Date.now()}`,
                characterId: activeChar.id,
                characterName: activeChar.name,
                sceneId: currentSceneId,
                lineText: linePrompt.trim() || `Neural voice take for @${activeChar.name}`,
                durationSec: 3.4,
                createdAt: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                source: 'Studio Synth'
              };
              onAddVoiceTake(newTake);
              onAssignTakeToCharacter(activeChar.id, newTake);
              handlePlayTake(newTake);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate AI Voice Take</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          Assigned takes automatically sync to Cast cards
        </span>
      </div>

      {/* Recorded Takes List */}
      {voiceTakes.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-mono uppercase text-slate-400">
            Recorded Character Voice Takes ({voiceTakes.length})
          </span>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {voiceTakes.map((take) => {
              const isPlayingThis = playingTakeId === take.id;
              return (
                <div
                  key={take.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="font-bold text-cyan-400">@{take.characterName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-400">{take.source}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 tabular-nums">{take.durationSec}s</span>
                    </div>
                    <p className="text-slate-200 truncate mt-0.5">“{take.lineText}”</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePlayTake(take)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition whitespace-nowrap shrink-0 ${
                        isPlayingThis
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
                      }`}
                    >
                      {isPlayingThis ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Playing</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAssignTakeToCharacter(take.characterId, take);
                        onToast(`Assigned take as active voice for @${take.characterName}`);
                      }}
                      title="Set as Character Active Voice Take"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteVoiceTake(take.id)}
                      title="Delete Take"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 border border-slate-700 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
