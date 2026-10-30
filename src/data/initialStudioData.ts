import { CastMember, SceneShot, StoryBeat, AudioTrackMix } from '../types/studio';

// Self-contained SVG portraits (zero external network dependency)
export const PRESET_PORTRAITS: { label: string; url: string }[] = [
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
  },
  {
    label: 'Kael — Orbital Courier',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <rect width="160" height="160" fill="#06281e"/>
        <path d="M28 160 C35 115 125 115 132 160 Z" fill="#0f172a" stroke="#10b981" stroke-width="2"/>
        <ellipse cx="80" cy="76" rx="28" ry="33" fill="#334155"/>
        <rect x="56" y="66" width="48" height="16" rx="8" fill="#064e3b" stroke="#34d399" stroke-width="2"/>
        <circle cx="70" cy="74" r="3" fill="#6ee7b7"/>
        <circle cx="90" cy="74" r="3" fill="#6ee7b7"/>
        <path d="M72 94 L88 94" stroke="#a7f3d0" stroke-width="2"/>
      </svg>
    `)}`
  },
  {
    label: 'Vesper — Noir Archivist',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <rect width="160" height="160" fill="#111827"/>
        <path d="M30 160 C38 118 122 118 130 160 Z" fill="#1f2937" stroke="#9ca3af" stroke-width="2"/>
        <ellipse cx="80" cy="78" rx="26" ry="32" fill="#374151"/>
        <polygon points="36,56 124,56 104,36 56,36" fill="#030712" stroke="#6b7280" stroke-width="1.5"/>
        <circle cx="69" cy="76" r="3" fill="#f3f4f6"/>
        <circle cx="91" cy="76" r="3" fill="#f3f4f6"/>
        <path d="M74 94 Q80 92 86 94" stroke="#d1d5db" stroke-width="2" fill="none"/>
      </svg>
    `)}`
  }
];

export const INITIAL_CAST: CastMember[] = [
  {
    id: 'char-1',
    name: 'Elena',
    role: 'PROT',
    color: 'orange',
    archetype: 'Cyber-Detective',
    facePrompt: 'Sharp cybernetic ocular implant, rain-slicked trench coat, neon orange collar',
    avatarUrl: PRESET_PORTRAITS[0].url,
    voiceModel: 'Nova (Husky Alto)',
    voiceStyle: 'Noir Gritty',
    pitch: 1.0,
    speed: 1.0,
    faceLocked: false,
    voiceLocked: false
  },
  {
    id: 'char-2',
    name: 'Leo',
    role: 'PROT',
    color: 'cyan',
    archetype: 'Netrunner',
    facePrompt: 'Glowing cyan neural jack, silver tech-visor, street hoodie',
    avatarUrl: PRESET_PORTRAITS[1].url,
    voiceModel: 'Orion (Calm Tenor)',
    voiceStyle: 'Fast & Analytical',
    pitch: 1.1,
    speed: 1.1,
    faceLocked: false,
    voiceLocked: false
  },
  {
    id: 'char-3',
    name: 'Aria',
    role: 'SIDE',
    color: 'pink',
    archetype: 'AI Informant',
    facePrompt: 'Holographic translucent skin, magenta bob haircut, geometric earrings',
    avatarUrl: PRESET_PORTRAITS[2].url,
    voiceModel: 'Lyra (Ethereal Synth)',
    voiceStyle: 'Harmonic Echo',
    pitch: 1.3,
    speed: 1.0,
    faceLocked: false,
    voiceLocked: false
  },
  {
    id: 'char-4',
    name: 'Malakor',
    role: 'ANTA',
    color: 'amber',
    archetype: 'Syndicate Boss',
    facePrompt: 'Chrome jaw prosthetic, tailored obsidian suit, golden cyber-eyes',
    avatarUrl: PRESET_PORTRAITS[3].url,
    voiceModel: 'Titan (Deep Gravel)',
    voiceStyle: 'Commanding & Cold',
    pitch: 0.7,
    speed: 0.9,
    faceLocked: false,
    voiceLocked: false
  }
];

export const INITIAL_SCENES: SceneShot[] = [
  {
    id: 1,
    title: 'Neon Rain on Lower Deck',
    slugline: 'EXT. NEO-TOKYO SUBLEVEL 09 - NIGHT',
    script: `EXT. NEO-TOKYO SUBLEVEL 09 - NIGHT

The neon rain washes over the mirror-like pavement of Neo-Tokyo's lowest sublevel. Steam vents hiss through corroded iron grates.

@Elena crouches beside a shattered holographic kiosk, her ocular implant scanning the residual data trail.

@Elena
(low, guarded)
"The signal is coming from beneath the reactor core. Stay sharp, @Leo."`,
    camera: 'CAMERA: Slow Dolly In [1.0x]',
    lens: '35mm Anamorphic · T2.0',
    lighting: 'Cyan sodium vapor rim light against wet asphalt reflections',
    foleyNote: 'Heavy rain on synth-leather, distant turbine thrum, ocular servo click',
    durationSec: 45,
    tensionLevel: 62,
    style: 'cyberpunk'
  },
  {
    id: 2,
    title: 'Alleyway Confrontation',
    slugline: 'EXT. KOWLOON CONDUIT ALLEY - NIGHT',
    script: `EXT. KOWLOON CONDUIT ALLEY - NIGHT

High-contrast shadows slice across wet concrete. A matte-black spinner idles above the drainage canal, rotors chopping the mist.

@Elena steps out from the holographic shadows, hand resting near her sidearm. @Malakor waits beside the open gull-wing door, chrome jaw glinting amber.

@Malakor
(cold, unhurried)
"You're chasing a ghost that erased itself three cycles ago, Detective."

@Elena
(stepping into the light)
"Ghosts don't leave encrypted ledger keys in Sector Four."`,
    camera: 'CAMERA: Low Angle Pan [0.8x]',
    lens: '50mm Prime · Shallow DOF',
    lighting: 'Hard chiaroscuro key light from spinner headlamps',
    foleyNote: 'Low turbine idle, puddles splashing under boots, metallic jaw click',
    durationSec: 52,
    tensionLevel: 84,
    style: 'noir'
  },
  {
    id: 3,
    title: 'Skyline Data Heist',
    slugline: 'INT. ARASAKA RELAY SPIRE - ROOFTOP LEDGE - NIGHT',
    script: `INT. ARASAKA RELAY SPIRE - ROOFTOP LEDGE - NIGHT

Gale-force wind whips across the glass parapet 120 stories above the megacity grid.

@Leo jacks his fiber-optic lead directly into the mainframe tower while @Aria materializes on his wrist projector, scanning drone patrol vectors overhead.

@Aria
(urgent harmonic echo)
"Two syndicate gunships banking around the west spire. Ninety seconds until firewall lockdown."

@Leo
(fingers flying across deck)
"Seventy is all I need. Keep their radar blind, @Aria."`,
    camera: 'CAMERA: Crane Orbit [1.2x]',
    lens: '24mm Wide Anamorphic',
    lighting: 'Magenta & electric cyan billboard pulse across rain-streaked glass',
    foleyNote: 'High-altitude wind howl, fiber jack lock, rapid mechanical keystrokes',
    durationSec: 38,
    tensionLevel: 94,
    style: 'anime'
  }
];

export const INITIAL_BEATS: StoryBeat[] = [
  {
    id: 'beat-1',
    act: 'ACT I · SETUP',
    beatName: '01. The Ghost Signal in Sublevel 09',
    sequenceSummary: '@Elena discovers an unauthorized neural broadcast leaking from a decommissioned cooling tower.',
    visualMotif: 'Anamorphic cyan reflections in oil-slicked puddles',
    subtextGoal: 'Establish Elena’s isolation and obsession with the unsolved blackout case.',
    tension: 45
  },
  {
    id: 'beat-2',
    act: 'ACT I · INCITING INCIDENT',
    beatName: '02. Extraction Pact with the Netrunner',
    sequenceSummary: '@Elena corners @Leo in an underground arcade and trades immunity for his decryption rig.',
    visualMotif: 'Flickering CRT scanlines across faces in tight close-up',
    subtextGoal: 'Forced alliance between cynical lawman and distrustful street hacker.',
    tension: 65
  },
  {
    id: 'beat-3',
    act: 'ACT II · RISING ACTION',
    beatName: '03. Alleyway Ultimatum',
    sequenceSummary: '@Malakor intercepts the pair, revealing the Syndicate owns the city’s memory grid.',
    visualMotif: 'Low-angle Dutch framing with harsh amber spinner headlights',
    subtextGoal: 'Shift stakes from a local data theft to city-wide cognitive erasure.',
    tension: 82
  },
  {
    id: 'beat-4',
    act: 'ACT III · CLIMAX',
    beatName: '04. Spire Mainframe Uplink',
    sequenceSummary: '@Leo and @Aria breach the rooftop relay while @Elena holds the elevator atrium.',
    visualMotif: 'Vertiginous crane orbit over Neo-Tokyo’s neon abyss',
    subtextGoal: 'Total trust under countdown pressure; broadcasting the raw truth.',
    tension: 96
  }
];

export const INITIAL_AUDIO_MIX: AudioTrackMix[] = [
  {
    id: 'track-rain',
    name: 'Ambient Rain & Downpour Foley',
    category: 'Atmos Layer · Stereo Wide',
    description: 'Continuous rain hitting wet asphalt, corrugated steel, and puddles',
    volume: 75,
    muted: false,
    synthType: 'rain'
  },
  {
    id: 'track-hum',
    name: 'Sublevel Neon Transformer Hum',
    category: 'Diegetic Drone · 60Hz Warmth',
    description: 'Low-frequency electrical ballast buzz and distant ventilation turbines',
    volume: 55,
    muted: false,
    synthType: 'hum'
  },
  {
    id: 'track-pulse',
    name: 'Anamorphic Tension Sub-Pulse',
    category: 'Score Stem · Analog CS-80',
    description: 'Rhythmic sub-bass heartbeat synced to scene tension curve',
    volume: 65,
    muted: false,
    synthType: 'pulse'
  },
  {
    id: 'track-foley',
    name: 'Tactical Foley & Ocular Servos',
    category: 'Spot SFX · Center Channel',
    description: 'Trench coat movement, terminal keystrokes, and cybernetic lens focus',
    volume: 80,
    muted: false,
    synthType: 'foley'
  }
];
