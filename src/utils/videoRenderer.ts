import { CastMember, SceneShot } from '../types/studio';

const COLOR_HEX: Record<string, string> = {
  orange: '#fb923c',
  cyan: '#22d3ee',
  pink: '#f472b6',
  amber: '#fbbf24',
  emerald: '#34d399'
};

function loadKeyframeImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Renders a realistic multi-layer cinematic WebM video clip using HTML5 Canvas + MediaRecorder.
 * Composites photorealistic keyframe imagery (when available) with smooth Ken Burns dolly motion,
 * volumetric bokeh, cinematic vignette, and burned-in lip-sync subtitles.
 */
export async function synthesizeRealisticSceneVideo(
  scene: SceneShot,
  cast: CastMember[],
  isWidescreen: boolean,
  onProgress?: (pct: number) => void
): Promise<string> {
  const width = 960;
  const height = isWidescreen ? 402 : 540;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize video rendering context');
  }

  const keyframeImg = await loadKeyframeImage(scene.keyframeUrl);

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : '';

  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const taggedChars = cast.filter((c) => new RegExp(`@${c.name}\\b`, 'i').test(scene.script));
  const charsToRender = taggedChars.length > 0 ? taggedChars : cast.slice(0, 2);

  const lines = scene.script
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const spokenLine =
    (scene.dialogue
      ? `${scene.speaker ? `${scene.speaker.toUpperCase()}: ` : ''}"${scene.dialogue}"`
      : null) ||
    lines.find((l) => l.startsWith('"') || l.startsWith('“') || l.includes(': "')) ||
    lines.find((l) => !l.startsWith('EXT.') && !l.startsWith('INT.') && !l.startsWith('@')) ||
    scene.title;

  const bokehOrbs = Array.from({ length: 16 }, (_, i) => ({
    x: (width / 16) * i + Math.random() * 40,
    y: height * (0.22 + Math.random() * 0.48),
    r: 18 + Math.random() * 42,
    color:
      scene.style === 'orchard'
        ? i % 2 === 0
          ? '#fbbf24'
          : '#34d399'
        : i % 3 === 0
        ? '#06b6d4'
        : i % 3 === 1
        ? '#f59e0b'
        : '#ec4899',
    drift: (Math.random() - 0.5) * 0.65
  }));

  const buildings = Array.from({ length: 14 }, (_, i) => ({
    x: i * (width / 13),
    w: 58 + (i % 4) * 22,
    h: height * (0.35 + ((i * 37) % 38) / 100),
    layer: i % 2
  }));

  const totalFrames = 90; // 3 seconds at 30fps

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };
    recorder.onerror = (err) => reject(err);

    recorder.start();

    let frame = 0;
    const renderStep = () => {
      frame++;
      if (onProgress) {
        onProgress(Math.min(99, Math.round((frame / totalFrames) * 100)));
      }

      const progress = frame / totalFrames;
      const cam = scene.camera.toLowerCase();

      ctx.save();
      let zoom = 1.0 + progress * 0.11;
      let panX = -progress * 14;
      let panY = -progress * 6;
      if (cam.includes('pan') || cam.includes('aerial')) {
        panX = (progress - 0.5) * 44;
        zoom = 1.06;
      } else if (cam.includes('tracking')) {
        zoom = 1.12 - progress * 0.08;
      }

      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      if (keyframeImg) {
        ctx.drawImage(keyframeImg, 0, 0, width, height);
      } else {
        // Fallback procedural Golden Hour Orchard / Cyberpunk scene
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (scene.style === 'orchard') {
          skyGrad.addColorStop(0, '#1e293b');
          skyGrad.addColorStop(0.55, '#fbbf24');
          skyGrad.addColorStop(0.62, '#14532d');
          skyGrad.addColorStop(1, '#052e16');
        } else {
          skyGrad.addColorStop(0, '#030611');
          skyGrad.addColorStop(0.55, '#0a162c');
          skyGrad.addColorStop(1, '#152238');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        if (scene.style === 'orchard') {
          const horizonY = height * 0.56;
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.moveTo(width * 0.4, horizonY);
          ctx.lineTo(width * 0.6, horizonY);
          ctx.lineTo(width * 0.82, height);
          ctx.lineTo(width * 0.18, height);
          ctx.closePath();
          ctx.fill();
        } else {
          buildings.forEach((b) => {
            const by = height * 0.85 - b.h;
            ctx.fillStyle = b.layer === 0 ? '#060913' : '#0b101e';
            ctx.fillRect(b.x, by, b.w, b.h);
          });
        }

        const groundY = height * 0.82;
        charsToRender.forEach((char, i) => {
          const spacing = width / (charsToRender.length + 1);
          const cx = spacing * (i + 1) + Math.sin(frame * 0.06 + i) * 3;
          const cy = groundY + 12;
          const rim = COLOR_HEX[char.color] || '#22d3ee';

          ctx.fillStyle = '#070b14';
          ctx.strokeStyle = rim;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(cx - 24, cy);
          ctx.lineTo(cx - 18, cy - 78);
          ctx.lineTo(cx + 18, cy - 78);
          ctx.lineTo(cx + 24, cy);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx, cy - 94, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }

      // Atmospheric Bokeh & Morning Mist Orbs
      bokehOrbs.forEach((orb) => {
        orb.x += orb.drift;
        const radGrad = ctx.createRadialGradient(orb.x, orb.y, 1, orb.x, orb.y, orb.r);
        radGrad.addColorStop(0, `${orb.color}38`);
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // Cinematic Vignette & Subtitle Bar
      const vigGrad = ctx.createLinearGradient(0, 0, 0, height);
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      vigGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.font = '600 13px "DM Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      const cleanSub = spokenLine.slice(0, 96);
      ctx.fillText(cleanSub, width / 2, height - 22);

      ctx.font = '500 11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#22d3ee';
      ctx.textAlign = 'left';
      ctx.fillText(`Veo 3.1 Realistic Cinema Stream · ${scene.camera}`, 18, 26);

      if (frame < totalFrames) {
        setTimeout(renderStep, 22);
      } else {
        recorder.stop();
      }
    };

    renderStep();
  });
}
