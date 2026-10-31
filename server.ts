import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // POST /api/storyboard/breakdown - Breaks a screenplay into a 3-shot camera storyboard using Gemini 2.5 Flash
  app.post('/api/storyboard/breakdown', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured on server',
          fallback: true
        });
        return;
      }

      const { scriptText, cast } = req.body as {
        scriptText?: string;
        cast?: Array<{ name: string; role: string; facePrompt: string }>;
      };

      if (!scriptText || !scriptText.trim()) {
        res.status(400).json({ error: 'Missing scriptText' });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const castContext = Array.isArray(cast)
        ? cast.map((c) => `@${c.name} (${c.role}): ${c.facePrompt}`).join('\n')
        : '';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Break this screenplay into 3 cinematic video generation shots. Preserve @Character handles in prompts where applicable.\n\nCast Profiles:\n${castContext}\n\nScreenplay:\n${scriptText}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                camera: { type: Type.STRING },
                prompt: { type: Type.STRING },
                dialogue: { type: Type.STRING },
                speaker: { type: Type.STRING }
              },
              required: ['title', 'camera', 'prompt', 'dialogue', 'speaker']
            }
          }
        }
      });

      const rawText = response.text || '[]';
      const shots = JSON.parse(rawText);
      res.json({ shots });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Storyboard breakdown error';
      res.status(500).json({
        error: message,
        fallback: true
      });
    }
  });

  // POST /api/cast/suggest-archetypes - Analyzes script content & current cast to suggest missing character archetypes
  app.post('/api/cast/suggest-archetypes', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured on server',
          fallback: true
        });
        return;
      }

      const { scriptText, logline, cast } = req.body as {
        scriptText?: string;
        logline?: string;
        cast?: Array<{ name: string; role: string; archetype: string }>;
      };

      if (!scriptText || !scriptText.trim()) {
        res.status(400).json({ error: 'Missing scriptText' });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const existingCastSummary = Array.isArray(cast)
        ? cast.map((c) => `@${c.name} (Role: ${c.role}, Archetype: ${c.archetype})`).join('\n')
        : 'None';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following screenplay and current cast list. Identify 3 missing character archetypes that would strengthen the dramatic tension, subtext, and narrative scope of this project.\n\nProject Logline:\n${logline || ''}\n\nExisting Cast:\n${existingCastSummary}\n\nScreenplay Content:\n${scriptText}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                archetype: { type: Type.STRING },
                suggestedName: { type: Type.STRING },
                role: { type: Type.STRING },
                reason: { type: Type.STRING },
                dramaticFunction: { type: Type.STRING },
                facePrompt: { type: Type.STRING },
                voiceModel: { type: Type.STRING },
                sampleLine: { type: Type.STRING }
              },
              required: [
                'archetype',
                'suggestedName',
                'role',
                'reason',
                'dramaticFunction',
                'facePrompt',
                'voiceModel',
                'sampleLine'
              ]
            }
          }
        }
      });

      const rawText = response.text || '[]';
      const suggestions = JSON.parse(rawText);
      res.json({ suggestions });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Archetype suggestion error';
      res.status(500).json({
        error: message,
        fallback: true
      });
    }
  });

  // POST /api/video/generate - Generates or extends a realistic scene video using Veo / Omni Flash
  app.post('/api/video/generate', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured on server',
          fallback: true
        });
        return;
      }

      const {
        prompt,
        aspectRatio = '16:9',
        duration = '5s',
        resolution = '720p',
        previousInteractionId
      } = req.body as {
        prompt: string;
        aspectRatio?: '16:9' | '9:16';
        duration?: '5s' | '10s';
        resolution?: '720p' | '1080p';
        previousInteractionId?: string;
      };

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Missing video prompt' });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const interaction = await ai.interactions.create({
        model: 'gemini-omni-1.1-flash',
        input: prompt,
        ...(previousInteractionId ? { previous_interaction_id: previousInteractionId } : {}),
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
          duration: duration === '10s' ? '10s' : '5s',
          resolution: resolution === '1080p' ? '1080p' : '720p'
        }
      });

      let videoBase64: string | null = null;
      let mimeType = 'video/mp4';

      const outputs = (interaction as unknown as {
        outputs?: Array<{ type: string; data?: string; mime_type?: string }>;
      }).outputs;

      if (Array.isArray(outputs)) {
        for (const output of outputs) {
          if (output.type === 'video' && output.data) {
            videoBase64 = output.data;
            if (output.mime_type) mimeType = output.mime_type;
            break;
          }
        }
      }

      if (!videoBase64) {
        res.status(502).json({
          error: 'No video output returned from model',
          fallback: true
        });
        return;
      }

      res.json({
        interactionId: (interaction as unknown as { id?: string }).id || null,
        videoDataUrl: `data:${mimeType};base64,${videoBase64}`,
        mimeType
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Video generation error';
      res.status(500).json({
        error: message,
        fallback: true
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`STORYCAST Studio Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
