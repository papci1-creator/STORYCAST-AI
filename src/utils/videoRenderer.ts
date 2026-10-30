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
 * supporting Golden Hour Orchard, Cyberpunk, Noir, Anime, and Chiaroscuro visual styles.
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

  // Extract spoken line or scene dialogue for subtitle burn-in
  const lines = scene.script
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const spokenLine =
    (scene.dialogue
      ? `${scene.speaker ? `${scene.speaker}: ` : ''}"${scene.dialogue}"`
      : null) ||
    lines.find((l) => l.startsWith('"') || l.startsWith('“') || l.includes(': "')) ||
    lines.find((l) => !l.startsWith('EXT.') && !l.startsWith('INT.') && !l.startsWith('@')) ||
    scene.title;

  const raindrops = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    len: 14 + Math.random() * 20,
    speed: 8 + Math.random() * 8,
    alpha: 0.14 + Math.random() * 0.3
  }));

  const bokehOrbs = Array.from({ length: 18 }, (_, i) => ({
    x: (width / 18) * i + Math.random() * 40,
    y: height * (0.24 + Math.random() * 0.48),
    r: 16 + Math.random() * 42,
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

      // 1. Sky & Atmosphere Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (scene.style === 'orchard') {
        skyGrad.addColorStop(0, '#1e293b');
        skyGrad.addColorStop(0.55, '#fbbf24');
        skyGrad.addColorStop(0.62, '#14532d');
        skyGrad.addColorStop(1, '#052e16');
      } else if (scene.style === 'noir') {
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
      let zoom = 1.0 + progress * 0.09;
      let panX = 0;
      let panY = 0;
      if (cam.includes('pan') || cam.includes('aerial')) {
        panX = (progress - 0.5) * 44;
        zoom = 1.05;
      } else if (cam.includes('orbit') || cam.includes('crane')) {
        panX = Math.cos(progress * Math.PI) * 26;
        panY = (0.5 - progress) * 20;
        zoom = 1.07;
      } else if (cam.includes('tracking')) {
        zoom = 1.12 - progress * 0.08;
      }
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      if (scene.style === 'orchard') {
        const horizonY = height * 0.56;

        // Golden sun glow on horizon
        const sunGrad = ctx.createRadialGradient(
          width * 0.48,
          horizonY - 12,
          8,
          width * 0.48,
          horizonY - 12,
          170
        );
        sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
        sunGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.25)');
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(width * 0.48, horizonY - 12, 170, 0, Math.PI * 2);
        ctx.fill();

        // Distant Skyline (Shot 3) or Farm Storage Barn Silhouette
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        if (
          scene.title.toLowerCase().includes('highway') ||
          scene.title.toLowerCase().includes('skyline')
        ) {
          [260, 305, 355, 400, 455, 510, 565, 615].forEach((x, i) => {
            const h = 65 + (i % 3) * 35;
            ctx.fillRect(x, horizonY - h, 38, h);
          });
        } else {
          // Farm barn & orchard tree line
          ctx.fillRect(width * 0.56, horizonY - 68, 280, 68);
          for (let tx = 40; tx < width * 0.52; tx += 56) {
            ctx.beginPath();
            ctx.arc(tx, horizonY - 18, 28, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Dirt Farm Road Perspective
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(width * 0.4, horizonY);
        ctx.lineTo(width * 0.6, horizonY);
        ctx.lineTo(width * 0.82, height);
        ctx.lineTo(width * 0.18, height);
        ctx.closePath();
        ctx.fill();

        // Vintage Beige Mercedes / Two-Shot Blocking
        if (scene.camera.toLowerCase().includes('two-shot')) {
          ctx.fillStyle = '#0f172a';
          const leftX = width * 0.37 + Math.sin(frame * 0.05) * 2;
          const rightX = width * 0.63 - Math.sin(frame * 0.05) * 2;
          ctx.beginPath();
          ctx.arc(leftX, height * 0.58, 34, 0, Math.PI * 2);
          ctx.arc(rightX, height * 0.57, 34, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(leftX - 45, height * 0.65, 90, 150);
          ctx.fillRect(rightX - 45, height * 0.64, 90, 155);
        } else {
          const carOffsetY = cam.includes('tracking') ? progress * 16 : 0;
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.fillRect(width * 0.39, height * 0.64 + carOffsetY, 210, 74);
          ctx.strokeRect(width * 0.39, height * 0.64 + carOffsetY, 210, 74);
        }
      } else {
        // 3. Distant City Parallax Silhouette
        buildings.forEach((b, idx) => {
          const by = height * 0.85 - b.h;
          ctx.fillStyle = b.layer === 0 ? '#060913' : '#0b101e';
          ctx.fillRect(b.x, by, b.w, b.h);

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

        // Wet Pavement Reflection Plane
        const groundY = height * 0.82;
        const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
        groundGrad.addColorStop(0, '#050811');
        groundGrad.addColorStop(1, '#0b1324');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, groundY, width, height - groundY);

        // Blocked Character Figures with Rim Lighting
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

      ctx.restore();

      // Optional Rain Streaks for non-orchard scenes
      if (scene.style !== 'orchard') {
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
      }

      // Cinema Letterbox & Burned-In Subtitle / Timecode Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
      ctx.fillRect(0, height - 48, width, 48);

      ctx.font = '600 13px "DM Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      const cleanSub = spokenLine.replace(/^["“]|["”]$/g, '').slice(0, 92);
      ctx.fillText(cleanSub, width / 2, height - 20);

      ctx.font = '500 11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#22d3ee';
      ctx.textAlign = 'left';
      ctx.fillText(`${scene.slugline} · ${scene.camera}`, 16, 24);

      if (frame < totalFrames) {
        setTimeout(renderStep, 22);
      } else {
        recorder.stop();
      }
    };

    renderStep();
  });
}
