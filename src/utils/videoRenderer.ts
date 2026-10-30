import { CastMember, SceneShot } from '../types/studio';

const COLOR_HEX: Record<string, string> = {
  orange: '#fb923c',
  cyan: '#22d3ee',
  pink: '#f472b6',
  amber: '#fbbf24',
  emerald: '#34d399'
};

/**
 * Renders a realistic multi-layer cinematic WebM video clip using HTML5 Canvas + MediaRecorder
 * when offline or when a paid API key is not configured on the server.
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

  // Extract first spoken line for realistic cinema subtitle burn-in
  const lines = scene.script
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const spokenLine =
    lines.find((l) => l.startsWith('"') || l.startsWith('“') || l.includes(': "')) ||
    lines.find((l) => !l.startsWith('EXT.') && !l.startsWith('INT.') && !l.startsWith('@')) ||
    scene.title;

  const raindrops = Array.from({ length: 120 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    len: 16 + Math.random() * 24,
    speed: 9 + Math.random() * 9,
    alpha: 0.15 + Math.random() * 0.35
  }));

  const bokehOrbs = Array.from({ length: 18 }, (_, i) => ({
    x: (width / 18) * i + Math.random() * 40,
    y: height * (0.28 + Math.random() * 0.48),
    r: 14 + Math.random() * 38,
    color: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#f59e0b' : '#ec4899',
    drift: (Math.random() - 0.5) * 0.6
  }));

  const buildings = Array.from({ length: 14 }, (_, i) => ({
    x: i * (width / 13),
    w: 58 + (i % 4) * 22,
    h: height * (0.38 + ((i * 37) % 40) / 100),
    layer: i % 2
  }));

  const totalFrames = 90; // 3 seconds at 30fps for fast, responsive generation

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

      // 1. Deep Atmospheric Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (scene.style === 'noir') {
        skyGrad.addColorStop(0, '#040406');
        skyGrad.addColorStop(0.55, '#121318');
        skyGrad.addColorStop(1, '#23252e');
      } else if (scene.style === 'chiaroscuro') {
        skyGrad.addColorStop(0, '#090502');
        skyGrad.addColorStop(0.6, '#231306');
        skyGrad.addColorStop(1, '#422308');
      } else if (scene.style === 'anime') {
        skyGrad.addColorStop(0, '#0f0c29');
        skyGrad.addColorStop(0.55, '#302b63');
        skyGrad.addColorStop(1, '#4a1942');
      } else {
        skyGrad.addColorStop(0, '#030611');
        skyGrad.addColorStop(0.55, '#0a162c');
        skyGrad.addColorStop(1, '#152238');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Camera Motion Transform
      ctx.save();
      let zoom = 1.0 + progress * 0.1;
      let panX = 0;
      let panY = 0;
      if (cam.includes('pan')) {
        panX = (progress - 0.5) * 48;
        zoom = 1.06;
      } else if (cam.includes('orbit') || cam.includes('crane')) {
        panX = Math.cos(progress * Math.PI) * 28;
        panY = (0.5 - progress) * 22;
        zoom = 1.08;
      }
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // 3. Distant City Parallax Silhouette
      buildings.forEach((b, idx) => {
        const by = height * 0.85 - b.h;
        ctx.fillStyle = b.layer === 0 ? '#060913' : '#0b101e';
        ctx.fillRect(b.x, by, b.w, b.h);

        // Volumetric Window Grid
        ctx.fillStyle =
          scene.style === 'noir'
            ? 'rgba(228,228,231,0.45)'
            : idx % 2 === 0
            ? 'rgba(34,211,238,0.55)'
            : 'rgba(245,158,11,0.55)';
        for (let wy = by + 14; wy < height * 0.82; wy += 18) {
          for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 14) {
            if ((Math.floor(wx + wy) + idx) % 3 !== 0) {
              ctx.fillRect(wx, wy, 5, 8);
            }
          }
        }
      });

      // 4. Anamorphic Bokeh & Volumetric Fog
      bokehOrbs.forEach((orb) => {
        orb.x += orb.drift;
        const radGrad = ctx.createRadialGradient(orb.x, orb.y, 1, orb.x, orb.y, orb.r);
        radGrad.addColorStop(
          0,
          scene.style === 'noir' ? 'rgba(255,255,255,0.22)' : `${orb.color}44`
        );
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Wet Pavement Reflection Plane
      const groundY = height * 0.82;
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, '#050811');
      groundGrad.addColorStop(1, '#0b1324');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      // Horizontal Anamorphic Lens Flare Streak
      const flareY = groundY - 2;
      const flareGrad = ctx.createLinearGradient(0, flareY, width, flareY);
      flareGrad.addColorStop(0, 'rgba(6,182,212,0)');
      flareGrad.addColorStop(0.35, 'rgba(34,211,238,0.45)');
      flareGrad.addColorStop(0.65, 'rgba(245,158,11,0.45)');
      flareGrad.addColorStop(1, 'rgba(245,158,11,0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, flareY - 2, width, 4);

      // 6. Blocked Character Figures with Rim Lighting
      charsToRender.forEach((char, i) => {
        const spacing = width / (charsToRender.length + 1);
        const cx = spacing * (i + 1) + Math.sin(frame * 0.06 + i) * 3;
        const cy = groundY + 12;
        const rim = COLOR_HEX[char.color] || '#22d3ee';

        // Wet asphalt reflection
        const reflGrad = ctx.createRadialGradient(cx, cy + 12, 2, cx, cy + 12, 46);
        reflGrad.addColorStop(0, `${rim}66`);
        reflGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = reflGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 46, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Silhouette coat & shoulders
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

        // Head & Ocular Highlight
        ctx.beginPath();
        ctx.arc(cx, cy - 94, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = rim;
        ctx.beginPath();
        ctx.arc(cx + 5, cy - 95, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // 7. High-Velocity Rain Streaks
      ctx.lineWidth = 1.3;
      raindrops.forEach((r) => {
        ctx.strokeStyle = `rgba(165, 243, 252, ${r.alpha})`;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 4, r.y + r.len);
        ctx.stroke();
        r.y += r.speed;
        r.x -= 1.5;
        if (r.y > height) {
          r.y = -20;
          r.x = Math.random() * width;
        }
      });

      // 8. Cinema Letterbox & Burned-In Subtitle / Timecode Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, height - 48, width, 48);

      ctx.font = '600 13px "DM Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      const cleanSub = spokenLine.replace(/^["“]|["”]$/g, '').slice(0, 88);
      ctx.fillText(cleanSub, width / 2, height - 20);

      ctx.font = '500 11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#22d3ee';
      ctx.textAlign = 'left';
      ctx.fillText(`${scene.slugline} · ${scene.lens}`, 16, 24);

      if (frame < totalFrames) {
        setTimeout(renderStep, 22);
      } else {
        recorder.stop();
      }
    };

    renderStep();
  });
}
