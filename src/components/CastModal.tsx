import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  ScanFace,
  AudioWaveform,
  Volume2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { CastMember, CharacterColor, CharacterRole } from '../types/studio';
import { PRESET_PORTRAITS } from '../data/initialStudioData';
import { studioAudio } from '../utils/audioEngine';

interface CastModalProps {
  isOpen: boolean;
  editingCharacter: CastMember | null;
  onClose: () => void;
  onSave: (char: CastMember, isNew: boolean) => void;
  onDelete: (charId: string) => void;
  onToast: (msg: string) => void;
}

const VOICE_MODELS = [
  'Josh (Warm Baritone)',
  'Arnold (Gravelly Veteran)',
  'Adam (Deep Cinematic)',
  'Bella (Expressive Lead)',
  'Nova (Husky Alto)',
  'Orion (Calm Tenor)',
  'Lyra (Ethereal Synth)',
  'Titan (Deep Gravel)'
];

export const CastModal: React.FC<CastModalProps> = ({
  isOpen,
  editingCharacter,
  onClose,
  onSave,
  onDelete,
  onToast
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<CharacterRole>('PROT');
  const [color, setColor] = useState<CharacterColor>('cyan');
  const [archetype, setArchetype] = useState('Street Operative');
  const [facePrompt, setFacePrompt] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [voiceModel, setVoiceModel] = useState(VOICE_MODELS[0]);
  const [voiceStyle, setVoiceStyle] = useState('Natural');
  const [pitch, setPitch] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [faceLocked, setFaceLocked] = useState(false);
  const [voiceLocked, setVoiceLocked] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    if (editingCharacter) {
      setName(editingCharacter.name);
      setRole(editingCharacter.role);
      setColor(editingCharacter.color);
      setArchetype(editingCharacter.archetype || 'Operative');
      setFacePrompt(editingCharacter.facePrompt);
      setAvatarUrl(editingCharacter.avatarUrl);
      setVoiceModel(editingCharacter.voiceModel);
      setVoiceStyle(editingCharacter.voiceStyle);
      setPitch(editingCharacter.pitch);
      setSpeed(editingCharacter.speed);
      setFaceLocked(editingCharacter.faceLocked);
      setVoiceLocked(editingCharacter.voiceLocked);
    } else {
      setName('');
      setRole('PROT');
      setColor('cyan');
      setArchetype('Street Mercenary');
      setFacePrompt('Cyberpunk street mercenary, neon visor, weathered synth-leather jacket');
      setAvatarUrl(PRESET_PORTRAITS[4].url);
      setVoiceModel('Vega (Crisp Narrator)');
      setVoiceStyle('Confident & Clear');
      setPitch(1.0);
      setSpeed(1.0);
      setFaceLocked(false);
      setVoiceLocked(false);
    }
  }, [isOpen, editingCharacter]);

  if (!isOpen) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setAvatarUrl(ev.target.result);
        onToast('Custom face reference photo loaded');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCyclePreset = () => {
    const next = (presetIdx + 1) % PRESET_PORTRAITS.length;
    setPresetIdx(next);
    setAvatarUrl(PRESET_PORTRAITS[next].url);
    onToast(`Applied portrait: ${PRESET_PORTRAITS[next].label}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/^@/, '');
    if (!cleanName) {
      onToast('Please enter a character name');
      return;
    }

    const updated: CastMember = {
      id: editingCharacter ? editingCharacter.id : `char-${Date.now()}`,
      name: cleanName,
      role,
      color,
      archetype: archetype.trim() || 'Operative',
      facePrompt: facePrompt.trim() || 'Custom visual profile',
      avatarUrl,
      voiceModel,
      voiceStyle: voiceStyle.trim() || 'Natural',
      pitch,
      speed,
      faceLocked,
      voiceLocked
    };

    onSave(updated, !editingCharacter);
  };

  const handlePreviewVoice = () => {
    const targetName = name.trim() || 'Character';
    studioAudio.speakCharacterSample(targetName, voiceModel, pitch, speed);
    onToast(`Auditioning @${targetName} (${voiceModel} · ${pitch.toFixed(1)}x)`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cast-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#0d1322] border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 id="cast-modal-title" className="font-bold text-base text-white">
              {editingCharacter
                ? `Edit @${editingCharacter.name} — Face & Voice Studio`
                : 'Add New Cast Character'}
            </h3>
            <p className="text-xs text-slate-400">
              Configure unlocked visual seed & neural voice synthesis parameters
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elena"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Story Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CharacterRole)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="PROT">PROT (Protagonist)</option>
              <option value="ANTA">ANTA (Antagonist)</option>
              <option value="SIDE">SIDE (Sidekick)</option>
              <option value="SUPP">SUPP (Supporting)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Key Rim Color
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value as CharacterColor)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="orange">Neon Orange</option>
              <option value="cyan">Cyber Cyan</option>
              <option value="pink">Synth Pink</option>
              <option value="amber">Solar Amber</option>
              <option value="emerald">Matrix Emerald</option>
            </select>
          </div>
        </div>

        {/* UNLOCKED FACE / AVATAR SECTION */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase font-mono flex items-center gap-1.5">
              <ScanFace className="w-4 h-4" />
              <span>Face & Visual Reference ({faceLocked ? 'Locked' : 'Unlocked'})</span>
            </span>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={faceLocked}
                onChange={(e) => setFaceLocked(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span>Lock Face Seed</span>
            </label>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center overflow-hidden shrink-0 text-xl font-bold text-cyan-300">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Character avatar'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(name.trim() || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap shrink-0">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Face Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleCyclePreset}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preset Portrait</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 transition"
                >
                  Reset
                </button>
              </div>
              <span className="text-[11px] text-slate-400">
                Upload a custom portrait or describe facial features & wardrobe below.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-1">
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Archetype
              </label>
              <input
                type="text"
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                placeholder="e.g. Netrunner"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Facial Features & Wardrobe Prompt
              </label>
              <input
                type="text"
                value={facePrompt}
                onChange={(e) => setFacePrompt(e.target.value)}
                placeholder="Sharp cybernetic eyes, silver bob haircut, weathered trench coat..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* UNLOCKED VOICE ENGINE SECTION */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase font-mono flex items-center gap-1.5">
              <AudioWaveform className="w-4 h-4" />
              <span>Voice Synthesis Profile ({voiceLocked ? 'Locked' : 'Unlocked'})</span>
            </span>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={voiceLocked}
                onChange={(e) => setVoiceLocked(e.target.checked)}
                className="accent-amber-400 rounded"
              />
              <span>Lock Voice Clone</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Voice Model / Timbre
              </label>
              <select
                value={voiceModel}
                onChange={(e) => setVoiceModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {VOICE_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Delivery Emotion / Subtext
              </label>
              <input
                type="text"
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value)}
                placeholder="e.g. Noir Whisper, Urgent, Commanding"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums mb-1">
                <span>Pitch</span>
                <span>{pitch.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums mb-1">
                <span>Speed</span>
                <span>{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePreviewVoice}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-amber-300 flex items-center justify-center gap-2 transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>Test / Audition Voice Sample</span>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {editingCharacter ? (
            <button
              type="button"
              onClick={() => onDelete(editingCharacter.id)}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-rose-950/40 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Character</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
