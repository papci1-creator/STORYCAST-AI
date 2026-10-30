import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // POST /api/video/generate — Generates or extends a realistic scene video via gemini-omni-1.1-flash
  app.post('/api/video/generate', async (req, res) => {
    try {
      const {
        prompt,
        aspectRatio = '16:9',
        duration = '5s',
        resolution = '720p',
        previousInteractionId
      } = req.body || {};

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'A scene prompt is required for video generation.' });
        return;
      }

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
        res.status(403).json({
          error:
            'Paid API key not configured. Using local Studio Cinema Renderer fallback, or select a paid API key in Settings > Secrets.',
          code: 'PAID_KEY_REQUIRED'
        });
        return;
      }

      const ai = getGenAIClient();

      const validAspect = aspectRatio === '9:16' ? '9:16' : '16:9';
      const validDuration = duration === '10s' ? '10s' : '5s';
      const validResolution = ['360p', '720p', '1080p', '4k'].includes(resolution)
        ? resolution
        : '720p';

      const interactionParams: Record<string, unknown> = {
        model: 'gemini-omni-1.1-flash',
        input: prompt,
        background: false,
        store: true,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: validAspect,
          duration: validDuration,
          resolution: validResolution
        }
      };

      if (previousInteractionId) {
        interactionParams.previous_interaction_id = previousInteractionId;
      }

      const interaction = await ai.interactions.create(
        interactionParams as unknown as Parameters<typeof ai.interactions.create>[0],
        { timeout: 300000 }
      );

      const videoPart = interaction.output_video;
      if (videoPart?.data) {
        const mimeType = videoPart.mime_type || 'video/mp4';
        res.json({
          videoDataUrl: `data:${mimeType};base64,${videoPart.data}`,
          mimeType,
          interactionId: interaction.id,
          source: 'Veo 3 (Omni Flash)'
        });
        return;
      }

      if (videoPart?.uri) {
        res.json({
          videoDataUrl: videoPart.uri,
          mimeType: videoPart.mime_type || 'video/mp4',
          interactionId: interaction.id,
          source: 'Veo 3 (Omni Flash)'
        });
        return;
      }

      res.status(502).json({
        error: 'Model completed without returning video bytes.',
        code: 'EMPTY_VIDEO_OUTPUT'
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const status =
        message.includes('403') || message.includes('PERMISSION_DENIED')
          ? 403
          : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
          ? 429
          : 500;
      res.status(status).json({
        error: message,
        code: status === 403 || status === 429 ? 'PAID_KEY_REQUIRED' : 'GENERATION_ERROR'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`STORYCAST AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
