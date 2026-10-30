# STORYCAST AI — Splash Landing Experience & Live Studio Voice Recording

This plan integrates the **STORYCAST AI ("Write, Cast, & Generate Your Movie")** key art poster into a full-screen splash landing experience, unifies the studio branding with the poster's cyan-to-amber visual language, and adds a live studio microphone voice recorder so creators can record, visualize, and play back real voice takes for any cast character.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and design choices have been confirmed from your answers and will guide the implementation:

- **Confirmed Decision 1 — Full-Screen Splash Landing Page**: The application opens on a full-viewport splash screen showcasing the STORYCAST AI poster (`/assets/aistudio/1793348816253_9dede57d.jpg`), the branded clapperboard emblem, the *"WRITE, CAST, & GENERATE YOUR MOVIE"* headline, and the glowing **"START CREATING NOW"** call-to-action button (with an option in the studio header to return to the Splash Showcase at any time).
- **Confirmed Decision 2 — Branded Identity & Live Studio Microphone Recording**: We will adopt the poster's cyan-to-amber gradient typography and clapperboard mark, and build a browser-native **Studio Condenser Mic Recorder** (with real-time cyan/magenta/amber waveform bars) inside both the **Voice & Audio** tab and the **Cast Studio** cards so users can record live voice lines and attach them to characters.
- **Confirmed Decision 3 — "Start Creating Now" Action**: Clicking **"START CREATING NOW"** transitions smoothly into the Studio Workspace on the **Screenplay Editor** tab, initializes or focuses the active scene, and places the cursor ready for immediate writing.

---

## 1. Overview & Core Concept

- **What It Does**: Welcomes filmmakers and storytellers with a high-impact **STORYCAST AI** splash showcase before transitioning into the full screenplay, character face/voice synthesis, live microphone recording, and real-time pre-visualization studio.
- **Target Audience / Persona**: Screenwriters, indie directors, and solo creators producing multi-character scenes from a desktop or mobile studio setup.
- **Key Value**: Bridges the gap between narrative writing, custom voice performance (both neural TTS and real recorded microphone takes), and visual shot blocking in a single cohesive studio workflow.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Full-Screen Splash Arrival**: Users land on a full-screen dark studio showcase featuring the uploaded **STORYCAST AI** poster framed in a sleek glassmorphic cinema card alongside the clapperboard badge, cyan-to-amber headline (`STORYCAST AI — WRITE, CAST, & GENERATE YOUR MOVIE`), capability highlights (`01. Screenplay & @Character Tagging`, `02. Unlocked Face & Voice Studio`, `03. Live Mic Recording & Scene Pre-Viz`), and the prominent **"START CREATING NOW"** CTA button.
  2. **One-Click Launch into Script Editor**: Clicking **"START CREATING NOW"** (or *"Launch New Scene"*) transitions into the 12-column Studio Workspace, activates the **Script & Editor** tab, and focuses the screenplay editor.
  3. **Live Studio Microphone Recording**: In the **Voice & Audio** tab (and directly from any character card in **Cast & Voices**), users can select a character (`@Elena`, `@Leo`, `@Aria`, `@Malakor`, or custom cast), click **Record Mic Take**, speak into their device microphone while watching a live multi-color frequency waveform (`cyan` / `magenta` / `amber` matching the right monitor in the poster), and save/play back the recorded audio clip alongside synthesized voices.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast dark production studio (`#070b14` obsidian canvas, `#0d1322` elevated studio surfaces) inspired directly by the triple-monitor creator setup in the poster.
  - *Color Palette & Mood*:
    - Dominant Canvas (60%): Deep Studio Obsidian (`#070b14`) and Midnight Slate (`#0d1322`).
    - Structural Framing (30%): Subtle slate hairline borders (`#1e293b`), crisp white (`#f8fafc`) and cool muted slate (`#94a3b8`) typography.
    - Focal Accents (10%): Electric Cyan (`#06b6d4` / `#22d3ee`) paired with Solar Amber (`#f59e0b` / `#fbbf24`) for primary CTAs and active studio indicators, plus Synth Magenta (`#ec4899`) strictly inside the live audio waveform visualizer.
  - *Typography & Hierarchy*:
    - Display Headings: `Plus Jakarta Sans` (700/800 weight, tight tracking) with cyan-to-amber gradient emphasis on key brand display titles.
    - Body Copy: `DM Sans` (400/500/600) for clean readability across controls.
    - Screenplay & Timecode Telemetry: `IBM Plex Mono` with `tabular-nums` for sluglines, dialogue blocks, audio dB/duration readouts, and SMPTE timecodes.
  - *Component Styling & Mobile Scaling*: Preserves the 3-zone Top Bar Contract, single-elevation card depth, unboxed metadata with `·` separators, and responsive `<= 480px` viewport scaling (`13.5px` base font size, zero horizontal overflow).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Viewport Splash Mode with Instant Studio Switch**
  - *Chosen Approach*: Manage a top-level view mode (`'splash' | 'studio'`) defaulting to `'splash'` so the poster and **"START CREATING NOW"** experience command 100% of the viewport on arrival, while adding a *"Showcase"* link in the studio top bar so the user can return to the poster view at any time without losing script or cast edits.
  - *Why*: Matches your preference for a full-screen splash landing page while keeping state persistent in memory.
  - *Alternatives Considered*: A modal popup over the editor was rejected because it obscures the poster's full composition and feels cramped on mobile screens.

- **Decision 2: Browser-Native `MediaRecorder` + Web Audio Analyser for Mic Recording**
  - *Chosen Approach*: Use `navigator.mediaDevices.getUserMedia({ audio: true })` coupled with a Web Audio `AnalyserNode` (for real-time 60fps cyan/magenta/amber waveform bars) and `MediaRecorder` to capture real audio blobs (`URL.createObjectURL`) attached to specific characters and scenes. Include a graceful simulated mic take fallback if microphone permissions are denied or unavailable in the preview iframe.
  - *Why*: Ensures the microphone recording feature works with real hardware microphones when permitted, and never fails or dead-ends if the user is on a device without a mic or blocks permission.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        STORYCAST AI APPLICATION ROOT                      │
│     State: viewMode ('splash' | 'studio'), cast[], scenes[], takes[]      │
└───────────────────┬───────────────────────────────────────┬───────────────┘
                    │                                       │
                    ▼                                       ▼
┌───────────────────────────────────────┐ ┌─────────────────────────────────┐
│     FULL-SCREEN SPLASH LANDING        │ │        STUDIO WORKSPACE         │
│  ┌─────────────────────────────────┐  │ │  ┌───────────────────────────┐  │
│  │ Branded Clapperboard & Headline │  │ │  │ 3-Zone Top Navigation Bar │  │
│  │ "WRITE, CAST, & GENERATE MOVIE" │  │ │  └─────────────┬─────────────┘  │
│  ├─────────────────────────────────┤  │ │                │                │
│  │ Poster Showcase Card            │  │ │  ┌─────────────┴─────────────┐  │
│  │ (/assets/aistudio/...jpg)       │  │ │  │ Left Column (7 Cols)      │  │
│  ├─────────────────────────────────┤  │ │  │ • Screenplay & @Tags      │  │
│  │ "START CREATING NOW" CTA Button ├──┼─┼─►│ • Cast Face & Voice Studio│  │
│  │ (Launches Studio + New Scene)   │  │ │  │ • Beat Sheet & Blocking   │  │
│  └─────────────────────────────────┘  │ │  │ • Live Mic Recorder & Mix │  │
└───────────────────────────────────────┘ │  └─────────────┬─────────────┘  │
                                          │                │                │
                                          │  ┌─────────────┴─────────────┐  │
                                          │  │ Right Column (5 Cols)     │  │
                                          │  │ • Cinema Canvas Viewport  │  │
                                          │  │ • Table Read & Timeline   │  │
                                          │  └───────────────────────────┘  │
                                          └─────────────────────────────────┘
```

- **Data Model & State Extensions**:
  - `VoiceTake`: `{ id, characterId, characterName, sceneId, label, durationSec, audioUrl, timestamp, isRecordedMic }` stored in application state so recorded microphone takes appear in both the **Voice & Audio** tab and on the corresponding character card in **Cast & Voices**.
  - `CastMember`: Extended with optional `customTakeUrl?: string` so if a user records a live microphone take for `@Elena`, clicking **Audition Voice** can play either their recorded voice take or the neural voice synthesizer.

- **Interactive Component & State Mapping**:
  - **Splash CTA Handler**: Clicking **"START CREATING NOW"** sets `viewMode = 'studio'`, switches `activeTab = 'script'`, optionally initializes a fresh scene (or focuses the current scene), and scrolls smoothly to the screenplay editor textarea.
  - **Live Microphone Recorder Component**:
    - *Idle State*: Select target character (`@Elena`, `@Leo`, etc.) and dialogue line prompt; click **Record Mic Take**.
    - *Recording State*: Renders live animated cyan/magenta/amber frequency bars on an HTML5 canvas + elapsed recording timer (`00:04.2`); clicking **Stop & Save Take** finalizes the audio blob and attaches it to the selected character.
    - *Permission Fallback*: If microphone access is blocked by browser/iframe policy, offers an instant **Synthesize Studio Mic Take** fallback so the user can still test waveform visualization and multi-take playback seamlessly.
