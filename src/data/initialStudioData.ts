import { CastMember, SceneShot, StoryBeat, AudioTrackMix } from '../types/studio';

// Self-contained SVG & portrait presets
export const PRESET_PORTRAITS: { label: string; url: string }[] = [
  {
    label: 'Marcus — Orchard Engineer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
  },
  {
    label: 'Arthur — Veteran Grower',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
  },
  {
    label: 'Elena — Ocular Detective',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" fill="url(#bg1)"/>
        <circle cx="120" cy="36" r="42" fill="#f97316" opacity="0.14"/>
        <path d="M30 160 C34 116 126 116 130 160 Z" fill="#1e293b" stroke="#fb923c" stroke-width="2"/>
        <path d="M46 160 L58 118 L80 132 L102 118 L114 160 Z" fill="#0f172a" stroke="#f97316" stroke-width="1.5"/>
        <ellipse cx="80" cy="76" rx="28" ry="34" fill="#334155"/>
        <path d="M48 74 C48 40 112 40 112 74 L116 96 L104 88 L104 66 L56 66 L56 88 L44 96 Z" fill="#090d16"/>
        <circle cx="69" cy="76" r="3.5" fill="#e2e8f0"/>
        <circle cx="92" cy="76" r="6" fill="#090d16" stroke="#fb923c" stroke-width="2"/>
        <circle cx="92" cy="76" r="2.5" fill="#38bdf8"/>
        <line x1="84" y1="76" x2="102" y2="76" stroke="#38bdf8" stroke-width="1"/>
        <path d="M73 94 Q80 97 87 94" stroke="#94a3b8" stroke-width="2" fill="none"/>
      </svg>
    `)}`
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
  },
  {
    label: 'Aria — Hologram Construct',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#2e1065"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" fill="url(#bg3)"/>
        <circle cx="80" cy="80" r="58" fill="none" stroke="#f472b6" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
        <path d="M35 160 C40 120 120 120 125 160 Z" fill="#3b0764" stroke="#f472b6" stroke-width="2"/>
        <ellipse cx="80" cy="78" rx="26" ry="32" fill="#701a75" stroke="#f472b6" stroke-width="1.5"/>
        <path d="M48 84 C46 42 114 42 112 84 L104 88 L102 62 L58 62 L56 88 Z" fill="#db2777"/>
        <circle cx="70" cy="76" r="3.5" fill="#fdf2f8"/>
        <circle cx="90" cy="76" r="3.5" fill="#fdf2f8"/>
        <path d="M74 93 Q80 97 86 93" stroke="#fbcfe8" stroke-width="2" fill="none"/>
      </svg>
    `)}`
  },
  {
    label: 'Malakor — Syndicate Director',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1c1917"/>
            <stop offset="100%" stop-color="#090d16"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" fill="url(#bg4)"/>
        <path d="M22 160 C28 112 132 112 138 160 Z" fill="#090d16" stroke="#f59e0b" stroke-width="2"/>
        <polygon points="80,122 72,160 88,160" fill="#f59e0b"/>
        <rect x="52" y="44" width="56" height="66" rx="18" fill="#27272a" stroke="#52525b" stroke-width="2"/>
        <path d="M56 86 L104 86 L98 110 L62 110 Z" fill="#18181b" stroke="#f59e0b" stroke-width="1.5"/>
        <circle cx="68" cy="72" r="4" fill="#fbbf24"/>
        <circle cx="92" cy="72" r="4" fill="#fbbf24"/>
        <line x1="66" y1="98" x2="94" y2="98" stroke="#f59e0b" stroke-width="2"/>
      </svg>
    `)}`
  }
];

export const INITIAL_CAST: CastMember[] = [
  {
    id: 'c1',
    name: 'Marcus',
    role: 'PROT',
    color: 'emerald',
    archetype: 'Orchard Mechanic & Son',
    facePrompt: 'Young Black man, short afro, tan Carhartt jacket, denim jeans',
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
    id: 'c2',
    name: 'Arthur',
    role: 'PROT',
    color: 'amber',
    archetype: 'Veteran Orchard Farmer',
    facePrompt: 'Older weathered farmer, plaid flannel shirt, standing by tractor',
    avatarUrl: PRESET_PORTRAITS[1].url,
    voiceModel: 'Arnold (Gravelly Veteran)',
    voiceId: 'VR6AewLTigWG4xSOukaG',
    voiceStyle: 'Weathered & Dry Wit',
    pitch: 0.9,
    speed: 0.95,
    faceLocked: false,
    voiceLocked: false
  },
  {
    id: 'char-1',
    name: 'Elena',
    role: 'SIDE',
    color: 'orange',
    archetype: 'City Agricultural Broker',
    facePrompt: 'Sharp ocular glasses, tailored trench coat, leather ledger case',
    avatarUrl: PRESET_PORTRAITS[2].url,
    voiceModel: 'Bella (Expressive Lead)',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    voiceStyle: 'Crisp & Analytical',
    pitch: 1.05,
    speed: 1.0,
    faceLocked: false,
    voiceLocked: false
  }
];

export const INITIAL_SCENES: SceneShot[] = [
  {
    id: 1,
    title: 'Shot 1: Wide Orchard Establishing',
    slugline: 'EXT. APPLE ORCHARD - MORNING',
    script: `[SCENE 1: EXT. APPLE ORCHARD - MORNING]
Wide aerial shot of a misty farm harvest. Acoustic guitar music plays softly.

@Marcus stands beside a vintage Mercedes with the trunk open, wiping his hands with a shop rag. @Arthur stands next to a green tractor.

@Arthur: "You taking that heap? They judge an apple by how shiny the wax is, not the root."
@Marcus: "The turbo's for hauling grain, Dad." [SFX: Heavy car trunk slams shut]
@Arthur: "Then let 'em choke on the wax."`,
    camera: 'CAMERA: Wide Aerial Drone Pan [0.8x]',
    lens: '24mm Anamorphic · Golden Hour',
    lighting: 'Misty golden sunrise filtering through apple orchard canopy',
    foleyNote: 'Acoustic guitar chords, distant tractor diesel idle, morning birds',
    durationSec: 36,
    tensionLevel: 54,
    style: 'orchard',
    prompt:
      'Wide establishing shot of a misty green farm orchard at sunrise, workers loading apple crates by a pickup truck',
    dialogue:
      'You taking that heap? They judge an apple by how shiny the wax is, not the root.',
    speaker: 'Arthur'
  },
  {
    id: 2,
    title: 'Shot 2: Medium Two-Shot by Tractor',
    slugline: 'EXT. APPLE ORCHARD - TRACTOR BAY - MORNING',
    script: `EXT. APPLE ORCHARD - TRACTOR BAY - MORNING

Morning sun glints off the chrome trim of the vintage beige Mercedes.

@Marcus wipes grease from his knuckles with a shop rag, slamming the heavy trunk lid shut while @Arthur leans against the green tractor wheel.

@Marcus: "The turbo's for hauling grain, Dad." [SFX: Heavy car trunk slams shut]`,
    camera: 'CAMERA: Medium Two-Shot | 50mm Lens',
    lens: '50mm Prime · Shallow DOF',
    lighting: 'Warm backlight across Carhartt canvas and weathered flannel',
    foleyNote: 'Shop rag rustle, heavy vintage Mercedes trunk latch slam',
    durationSec: 42,
    tensionLevel: 68,
    style: 'orchard',
    prompt:
      'Medium shot of @Marcus in a tan Carhartt jacket wiping his hands by a vintage beige Mercedes trunk next to @Arthur in a plaid shirt by a green tractor',
    dialogue: "The turbo's for hauling grain, Dad.",
    speaker: 'Marcus'
  },
  {
    id: 3,
    title: 'Shot 3: Highway Departure Toward Skyline',
    slugline: 'EXT. FARM DIRT ROAD TO HIGHWAY - MORNING',
    script: `EXT. FARM DIRT ROAD TO HIGHWAY - MORNING

Dust rises in golden plumes behind the vintage beige Mercedes as @Marcus steers down the dirt farm lane through the open timber gates toward the distant city skyline.

@Arthur watches from the orchard ridge, hands in his flannel pockets.

@Arthur: "Then let 'em choke on the wax."`,
    camera: 'CAMERA: Low Angle Rear Tracking Shot',
    lens: '35mm Anamorphic · T2.0',
    lighting: 'Long morning shadows stretching toward the misty city horizon',
    foleyNote: 'Turbocharger spooling, tires crunching gravel road, wind through orchard',
    durationSec: 40,
    tensionLevel: 76,
    style: 'orchard',
    prompt:
      'Vintage beige Mercedes driving down a dirt farm road through open gates toward a distant city skyline in morning mist',
    dialogue: "Then let 'em choke on the wax.",
    speaker: 'Arthur'
  }
];

export const INITIAL_BEATS: StoryBeat[] = [
  {
    id: 'beat-1',
    act: 'SHOT 01 · ESTABLISHING',
    beatName: '01. Wide Orchard Establishing',
    sequenceSummary:
      'Wide aerial drone pan over the misty green farm orchard at sunrise as harvest crates are loaded and @Arthur questions @Marcus’s choice of car.',
    visualMotif: 'Golden morning mist over green orchard rows and farm storage barn',
    subtextGoal: 'Contrast generational pride in the root versus the city’s obsession with surface shine.',
    tension: 54
  },
  {
    id: 'beat-2',
    act: 'SHOT 02 · CONFRONTATION',
    beatName: '02. Medium Two-Shot by Tractor',
    sequenceSummary:
      '@Marcus wipes his hands by the vintage beige Mercedes trunk next to @Arthur’s green tractor before slamming the trunk shut.',
    visualMotif: '50mm shallow depth-of-field framing vintage steel against farm machinery',
    subtextGoal: 'Marcus defends his own practical way of carrying the family harvest forward.',
    tension: 68
  },
  {
    id: 'beat-3',
    act: 'SHOT 03 · DEPARTURE',
    beatName: '03. Highway Departure Toward Skyline',
    sequenceSummary:
      'Low-angle rear tracking shot following the vintage Mercedes down the dirt road toward the distant city skyline in the morning mist.',
    visualMotif: 'Dirt road perspective converging on distant city towers on the horizon',
    subtextGoal: 'Arthur’s unspoken blessing disguised as gruff defiance.',
    tension: 76
  }
];

export const INITIAL_AUDIO_MIX: AudioTrackMix[] = [
  {
    id: 'track-rain',
    name: 'Morning Orchard Wind & Acoustic Guitar',
    category: 'Atmos Layer · Stereo Wide',
    description: 'Soft acoustic harvest guitar with morning breeze through orchard leaves',
    volume: 70,
    muted: false,
    synthType: 'rain'
  },
  {
    id: 'track-hum',
    name: 'Green Tractor & Vintage Turbo Idle',
    category: 'Diegetic Engine · Low Warmth',
    description: 'Low-frequency diesel tractor idle and vintage Mercedes exhaust resonance',
    volume: 60,
    muted: false,
    synthType: 'hum'
  },
  {
    id: 'track-pulse',
    name: 'Cinematic Departure Bass Swell',
    category: 'Score Stem · Warm Analog',
    description: 'Subtle rhythmic pulse synced to the highway departure sequence',
    volume: 55,
    muted: false,
    synthType: 'pulse'
  },
  {
    id: 'track-foley',
    name: 'Trunk Slam & Gravel Tire Foley',
    category: 'Spot SFX · Center Channel',
    description: 'Heavy car trunk latch slam, gravel crunching under tires, and shop rag movement',
    volume: 85,
    muted: false,
    synthType: 'foley'
  }
];
