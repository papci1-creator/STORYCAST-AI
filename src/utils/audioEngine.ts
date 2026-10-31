import { CastMember, ShotSfxType } from '../types/studio';

class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private isAtmosPlaying = false;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private humGain: GainNode | null = null;
  private pulseGain: GainNode | null = null;
  private stopCallbacks: (() => void)[] = [];

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public speakDialogueLine(
    text: string,
    pitch = 1.0,
    speed = 1.0,
    volume = 1.0,
    onEnd?: () => void
  ) {
    if (!('speechSynthesis' in window)) {
      if (onEnd) setTimeout(onEnd, 2200);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.pitch = Math.max(0.5, Math.min(2.0, pitch || 1.0));
    utter.rate = Math.max(0.6, Math.min(1.8, speed || 1.0));
    utter.volume = Math.max(0, Math.min(1, volume));
    if (onEnd) {
      utter.onend = () => onEnd();
      utter.onerror = () => onEnd();
    }
    window.speechSynthesis.speak(utter);
  }

  public speakCharacterSample(
    name: string,
    voiceModel: string,
    pitch: number,
    speed: number,
    customLine?: string,
    onEnd?: () => void
  ) {
    this.playCueChime(pitch);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text =
        customLine ||
        `Voice & face lock active for ${name}. Profile ${voiceModel.split(' ')[0]} synchronized.`;
      const utter = new SpeechSynthesisUtterance(text);
      utter.pitch = Math.max(0.5, Math.min(2.0, pitch || 1.0));
      utter.rate = Math.max(0.6, Math.min(1.8, speed || 1.0));
      if (onEnd) {
        utter.onend = () => onEnd();
        utter.onerror = () => onEnd();
      }
      window.speechSynthesis.speak(utter);
    } else if (onEnd) {
      setTimeout(onEnd, 1500);
    }
  }

  public playAcousticChord(vol = 0.45) {
    try {
      const ctx = this.ensureContext();
      const freqs = [196.0, 246.94, 293.66, 392.0]; // G Major warm acoustic chord
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(Math.max(0.01, vol * 0.16), ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + 2.4);
      });
    } catch {
      // Ignore audio block before gesture
    }
  }

  public playTrunkSlamSfx(vol = 0.85) {
    try {
      const ctx = this.ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(Math.max(0.02, vol * 0.6), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch {
      // Ignore audio block before gesture
    }
  }

  public playEngineAccelSfx(vol = 0.85) {
    try {
      const ctx = this.ensureContext();
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(142, ctx.currentTime + 1.2);
      filter.type = 'lowpass';
      filter.frequency.value = 280;
      gain.gain.setValueAtTime(Math.max(0.02, vol * 0.35), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.32);
    } catch {
      // Ignore
    }
  }

  public triggerShotSfx(sfxType: ShotSfxType = 'guitar', vol = 0.85) {
    if (sfxType === 'slam') {
      this.playTrunkSlamSfx(vol);
    } else if (sfxType === 'engine') {
      this.playEngineAccelSfx(vol);
    } else {
      this.playAcousticChord(vol);
    }
  }

  public runSceneTableRead(
    script: string,
    cast: CastMember[],
    onSpeakerChange: (speaker: string | null, line: string | null) => void
  ) {
    if (!('speechSynthesis' in window)) {
      onSpeakerChange('Narrator', 'Speech synthesis unavailable in this browser.');
      setTimeout(() => onSpeakerChange(null, null), 2000);
      return;
    }

    window.speechSynthesis.cancel();
    const lines = script
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('('));

    let currentSpeaker: CastMember | null = null;
    const queue: { speaker: string; text: string; pitch: number; speed: number }[] = [];

    for (const rawLine of lines) {
      const inlineMatch = rawLine.match(/^@?([A-Za-z0-9_-]+):\s*["“]?(.+?)["”]?$/);
      if (inlineMatch) {
        const charName = inlineMatch[1];
        const spoken = inlineMatch[2].replace(/\[.*?\]/g, '').trim();
        const found = cast.find((c) => c.name.toLowerCase() === charName.toLowerCase());
        queue.push({
          speaker: found ? `@${found.name}` : `@${charName}`,
          text: spoken,
          pitch: found ? found.pitch : 1.0,
          speed: found ? found.speed : 1.0
        });
        currentSpeaker = null;
        continue;
      }

      const cueMatch = rawLine.match(/^@?([A-Za-z0-9_-]+)$/);
      if (cueMatch) {
        const candidate = cueMatch[1];
        const found = cast.find((c) => c.name.toLowerCase() === candidate.toLowerCase());
        if (found) {
          currentSpeaker = found;
          continue;
        }
      }

      if (currentSpeaker) {
        const cleanDialogue = rawLine.replace(/^["“]|["”]$/g, '');
        queue.push({
          speaker: `@${currentSpeaker.name}`,
          text: cleanDialogue,
          pitch: currentSpeaker.pitch,
          speed: currentSpeaker.speed
        });
        currentSpeaker = null;
      } else if (
        !rawLine.startsWith('EXT.') &&
        !rawLine.startsWith('INT.') &&
        !rawLine.startsWith('[')
      ) {
        queue.push({
          speaker: 'Action Direction',
          text: rawLine.replace(/@/g, ''),
          pitch: 0.95,
          speed: 1.05
        });
      }
    }

    if (queue.length === 0) {
      onSpeakerChange(null, null);
      return;
    }

    let idx = 0;
    const speakNext = () => {
      if (idx >= queue.length) {
        onSpeakerChange(null, null);
        return;
      }
      const item = queue[idx++];
      onSpeakerChange(item.speaker, item.text);
      const utter = new SpeechSynthesisUtterance(item.text);
      utter.pitch = item.pitch;
      utter.rate = item.speed;
      utter.onend = () => speakNext();
      utter.onerror = () => speakNext();
      window.speechSynthesis.speak(utter);
    };

    speakNext();
  }

  public stopTableRead() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public playCueChime(pitchMultiplier = 1.0) {
    try {
      const ctx = this.ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 440 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    } catch {
      // Ignore audio block before user gesture
    }
  }

  public toggleAtmosGenerator(
    volumes: { rain: number; hum: number; pulse: number },
    forceState?: boolean
  ): boolean {
    const nextState = forceState !== undefined ? forceState : !this.isAtmosPlaying;
    if (!nextState) {
      this.stopAtmos();
      return false;
    }

    try {
      const ctx = this.ensureContext();
      this.stopAtmos();

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(ctx.destination);

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1100;
      rainFilter.Q.value = 0.7;

      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = (volumes.rain / 100) * 0.5;

      whiteNoise.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);
      whiteNoise.start();

      const humOsc = ctx.createOscillator();
      humOsc.type = 'sawtooth';
      humOsc.frequency.value = 60;

      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.value = 140;

      this.humGain = ctx.createGain();
      this.humGain.gain.value = (volumes.hum / 100) * 0.15;

      humOsc.connect(humFilter);
      humFilter.connect(this.humGain);
      this.humGain.connect(this.masterGain);
      humOsc.start();

      const pulseOsc = ctx.createOscillator();
      pulseOsc.type = 'sine';
      pulseOsc.frequency.value = 48;

      this.pulseGain = ctx.createGain();
      this.pulseGain.gain.value = (volumes.pulse / 100) * 0.25;

      pulseOsc.connect(this.pulseGain);
      this.pulseGain.connect(this.masterGain);
      pulseOsc.start();

      this.stopCallbacks.push(() => {
        try {
          whiteNoise.stop();
          humOsc.stop();
          pulseOsc.stop();
        } catch {
          // ignore
        }
      });

      this.isAtmosPlaying = true;
      return true;
    } catch {
      return false;
    }
  }

  public updateAtmosVolumes(
    volumes: { rain: number; hum: number; pulse: number },
    ducked = false
  ) {
    const duckFactor = ducked ? 0.35 : 1.0;
    if (this.rainGain) this.rainGain.gain.value = (volumes.rain / 100) * 0.5 * duckFactor;
    if (this.humGain) this.humGain.gain.value = (volumes.hum / 100) * 0.15 * duckFactor;
    if (this.pulseGain) this.pulseGain.gain.value = (volumes.pulse / 100) * 0.25 * duckFactor;
  }

  public stopAtmos() {
    this.stopCallbacks.forEach((cb) => cb());
    this.stopCallbacks = [];
    this.isAtmosPlaying = false;
  }
}

export const studioAudio = new StudioAudioEngine();
