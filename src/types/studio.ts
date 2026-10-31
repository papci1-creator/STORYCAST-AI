export type CharacterRole = 'PROT' | 'ANTA' | 'SIDE' | 'SUPP';

export type CharacterColor = 'orange' | 'cyan' | 'pink' | 'amber' | 'emerald';

export type VisualStyle = 'orchard' | 'cyberpunk' | 'noir' | 'anime' | 'chiaroscuro';

export type ColorGradeLook = 'orchard' | 'kodak' | 'cyberpunk';

export type ShotSfxType = 'guitar' | 'slam' | 'engine';

export type VideoEngineModel =
  | 'fal-ai/veo3'
  | 'fal-ai/kling-video/v2/master/image-to-video'
  | 'fal-ai/runway-gen4';

export interface CastMember {
  id: string;
  name: string;
  role: CharacterRole;
  color: CharacterColor;
  archetype: string;
  facePrompt: string;
  avatarUrl: string;
  voiceModel: string;
  voiceId?: string;
  voiceStyle: string;
  pitch: number;
  speed: number;
  faceLocked: boolean;
  voiceLocked: boolean;
  customTakeUrl?: string;
  customTakeLabel?: string;
}

export interface VoiceTake {
  id: string;
  characterId: string;
  characterName: string;
  sceneId: number;
  lineText: string;
  durationSec: number;
  audioUrl?: string;
  createdAt: string;
  source: 'Microphone' | 'Studio Synth';
}

export interface SceneShot {
  id: number;
  title: string;
  slugline: string;
  script: string;
  camera: string;
  lens: string;
  lighting: string;
  foleyNote: string;
  durationSec: number;
  tensionLevel: number;
  style: VisualStyle;
  prompt?: string;
  dialogue?: string;
  speaker?: string;
  keyframeUrl?: string;
  sfx?: ShotSfxType;
  actors?: string[];
  status?: string;
  videoUrl?: string;
  videoSource?: string;
  videoResolution?: '720p' | '1080p' | '4k';
  videoClipDuration?: '4s' | '5s' | '10s';
  lastInteractionId?: string;
}

export interface StoryBeat {
  id: string;
  act: string;
  beatName: string;
  sequenceSummary: string;
  visualMotif: string;
  subtextGoal: string;
  tension: number;
}

export interface AudioTrackMix {
  id: string;
  name: string;
  category: string;
  description: string;
  volume: number;
  muted: boolean;
  synthType: 'rain' | 'hum' | 'pulse' | 'foley';
}

export interface SuggestedArchetype {
  id: string;
  archetype: string;
  suggestedName: string;
  role: CharacterRole;
  roleTitle: string;
  reason: string;
  dramaticFunction: string;
  facePrompt: string;
  voiceModel: string;
  sampleLine: string;
  avatarUrl: string;
  color: CharacterColor;
}
