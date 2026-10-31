import { CastMember, SceneShot, StoryBeat, AudioTrackMix } from '../types/studio';

export const PRESET_PORTRAITS: { label: string; url: string }[] = [
  {
    label: 'Marcus — Orchard Engineer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  },
  {
    label: 'Arthur — Veteran Grower',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
  },
  {
    label: 'Elena — Ocular Detective',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  },
  {
    label: 'Leo — Neural Netrunner',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#042f2e"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" fill="url(#bg2)"/>
        <circle cx="40" cy="40" r="45" fill="#06b6d4" opacity="0.15"/>
        <path d="M26 160 C32 114 128 114 134 160 Z" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>
        <ellipse cx="80" cy="78" rx="27" ry="33" fill="#475569"/>
        <path d="M52 60 L80 42 L108 60 L102 48 L80 34 L58 48 Z" fill="#e2e8f0"/>
        <rect x="55" y="68" width="50" height="14" rx="4" fill="#083344" stroke="#22d3ee" stroke-width="2"/>
        <line x1="62" y1="75" x2="98" y2="75" stroke="#67e8f9" stroke-width="2"/>
        <path d="M74 95 L86 95" stroke="#cbd5e1" stroke-width="2"/>
      </svg>
    `)}`
  }
];

export const INITIAL_CAST: CastMember[] = [
  {
    id: 'marcus',
    name: 'Marcus',
    role: 'PROT',
    color: 'emerald',
    archetype: 'Orchard Mechanic & Son',
    facePrompt: 'Young Black man, short afro, tan Carhartt work jacket, denim jeans',
    avatarUrl: PRESET_PORTRAITS[0].url,
    voiceModel: 'Josh (Warm Baritone)',
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    voiceStyle: 'Grounded & Determined',
    pitch: 1.0,
    speed: 1.0,
    faceLocked: false,
    voiceLocked: false
  },
  {
    id: 'arthur',
    name: 'Arthur',
    role: 'PROT',
    color: 'amber',
    archetype: 'Veteran Orchard Farmer',
    facePrompt: 'Older weathered farmer, plaid flannel shirt, standing by green tractor',
    avatarUrl: PRESET_PORTRAITS[1].url,
    voiceModel: 'Arnold (Gravelly Veteran)',
    voiceId: 'VR6AewLTigWG4xSOukaG',
    voiceStyle: 'Weathered & Dry Wit',
    pitch: 0.85,
    speed: 0.95,
    faceLocked: false,
    voiceLocked: false
  }
];

export const INITIAL_SCENES: SceneShot[] = [
  {
    id: 1,
    title: 'Shot 1: Wide Orchard Establishing',
    status: 'VIDEO READY',
    slugline: 'EXT. APPLE ORCHARD - MORNING',
    script: `EXT. APPLE ORCHARD - MORNING
@Arthur: "You taking that heap? They judge an apple by how shiny the wax is, not the root."
@Marcus: "The turbo's for hauling grain, Dad." [SFX: Trunk Slam]
@Arthur: "Then let 'em choke on the wax."`,
    camera: 'Wide Aerial Drone Pan [0.8x]',
    lens: '24mm Anamorphic · Golden Hour',
    lighting: 'Misty golden sunrise filtering through apple orchard canopy',
    foleyNote: 'Acoustic guitar intro, distant tractor diesel idle, morning birds',
    durationSec: 4.5,
    tensionLevel: 54,
    style: 'orchard',
    prompt:
      'Photorealistic wide morning shot of misty green farm harvest, pickup truck loaded with apple crates, golden hour sunlight',
    dialogue:
      'You taking that heap? They judge an apple by how shiny the wax is, not the root.',
    speaker: 'Arthur',
    keyframeUrl:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&auto=format&fit=crop&q=80',
    sfx: 'guitar',
    actors: ['Arthur', 'Marcus'],
    videoResolution: '1080p',
    videoClipDuration: '5s'
  },
  {
    id: 2,
    title: 'Shot 2: Medium Two-Shot by Tractor',
    status: 'VIDEO READY',
    slugline: 'EXT. APPLE ORCHARD - TRACTOR BAY - MORNING',
    script: `EXT. APPLE ORCHARD - TRACTOR BAY - MORNING
@Marcus wipes grease from his knuckles with a shop rag by the open vintage car trunk next to @Arthur by the green tractor.
@Marcus: "The turbo's for hauling grain, Dad." [SFX: Trunk Slam]`,
    camera: 'Medium Two-Shot | 50mm Prime',
    lens: '50mm Prime · Shallow DOF',
    lighting: 'Warm backlight across Carhartt canvas and weathered flannel',
    foleyNote: 'Shop rag rustle, heavy vintage car trunk latch slam',
    durationSec: 4.0,
    tensionLevel: 68,
    style: 'orchard',
    prompt:
      'Photorealistic medium two-shot of Marcus in tan Carhartt jacket wiping hands by open car trunk next to Arthur in flannel shirt by tractor',
    dialogue: "The turbo's for hauling grain, Dad.",
    speaker: 'Marcus',
    keyframeUrl:
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1000&auto=format&fit=crop&q=80',
    sfx: 'slam',
    actors: ['Marcus', 'Arthur'],
    videoResolution: '1080p',
    videoClipDuration: '5s'
  },
  {
    id: 3,
    title: 'Shot 3: Highway Departure Toward Skyline',
    status: 'VIDEO READY',
    slugline: 'EXT. FARM DIRT ROAD TO HIGHWAY - MORNING',
    script: `EXT. FARM DIRT ROAD TO HIGHWAY - MORNING
Vintage beige sedan driving down dirt orchard road through open farm gate toward distant city skyline in morning mist.
@Arthur: "Then let 'em choke on the wax."`,
    camera: 'Low Angle Rear Tracking Shot',
    lens: '35mm Anamorphic · T2.0',
    lighting: 'Long morning shadows stretching toward the misty city horizon',
    foleyNote: 'Car engine acceleration, tires crunching gravel road, wind through orchard',
    durationSec: 4.5,
    tensionLevel: 76,
    style: 'orchard',
    prompt:
      'Vintage beige sedan driving down dirt orchard road through open farm gate toward distant city skyline in morning mist',
    dialogue: "Then let 'em choke on the wax.",
    speaker: 'Arthur',
    keyframeUrl:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000&auto=format&fit=crop&q=80',
    sfx: 'engine',
    actors: ['Marcus'],
    videoResolution: '1080p',
    videoClipDuration: '5s'
  }
];

export const INITIAL_BEATS: StoryBeat[] = [
  {
    id: 'beat-1',
    act: 'SHOT 01 · ESTABLISHING',
    beatName: '01. Wide Orchard Establishing',
    sequenceSummary:
      'Wide aerial drone pan over the misty green farm orchard at sunrise as harvest crates are loaded and @Arthur questions @Marcus’s choice of car.',
    visualMotif: 'Golden morning mist over green orchard rows and pickup truck',
    subtextGoal:
      'Contrast generational pride in the root versus the city’s obsession with surface shine.',
    tension: 54
  },
  {
    id: 'beat-2',
    act: 'SHOT 02 · CONFRONTATION',
    beatName: '02. Medium Two-Shot by Tractor',
    sequenceSummary:
      '@Marcus wipes his hands by the open car trunk next to @Arthur’s green tractor before slamming the trunk shut.',
    visualMotif: '50mm shallow depth-of-field framing vintage steel against farm machinery',
    subtextGoal: 'Marcus defends his own practical way of carrying the family harvest forward.',
    tension: 68
  },
  {
    id: 'beat-3',
    act: 'SHOT 03 · DEPARTURE',
    beatName: '03. Highway Departure Toward Skyline',
    sequenceSummary:
      'Low-angle rear tracking shot following the vintage sedan down the dirt road toward the distant city skyline in the morning mist.',
    visualMotif: 'Dirt road perspective converging on distant city towers on the horizon',
    subtextGoal: 'Arthur’s unspoken blessing disguised as gruff defiance.',
    tension: 76
  }
];

export const INITIAL_AUDIO_MIX: AudioTrackMix[] = [
  {
    id: 'track-rain',
    name: 'Track 1: Character Lip-Sync Dialogue (ElevenLabs / TTS)',
    category: 'Center Channel · Lip-Sync Master',
    description: 'Primary character vocal performance synced to active shot subtitles',
    volume: 100,
    muted: false,
    synthType: 'rain'
  },
  {
    id: 'track-hum',
    name: 'Track 2: Acoustic Folk Guitar Score (Auto-Ducks on Speech)',
    category: 'Score Stem · G-Major Warm Acoustic',
    description: 'Warm acoustic folk guitar score that automatically ducks when actors speak',
    volume: 45,
    muted: false,
    synthType: 'hum'
  },
  {
    id: 'track-foley',
    name: 'Track 3: Foley & Sound Effects (Car Trunk Slam / Engine)',
    category: 'Spot SFX · Diegetic Foley',
    description: 'Heavy metallic car trunk slam, gravel crunch, and turbo engine acceleration',
    volume: 85,
    muted: false,
    synthType: 'foley'
  }
];
