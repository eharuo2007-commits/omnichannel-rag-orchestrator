import express from 'express';
import { executeNexusOrchestration } from '../src/services/geminiOrchestrator';
import { OmnichannelSource } from '../src/domain/types';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  const hasServerKey = Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  );
  res.json({
    status: 'ok',
    service: 'Nexus Orchestrator API',
    model: 'gemini-3.8-flash',
    sdk: '@google/genai (Interactions API)',
    serverKeyConfigured: hasServerKey,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/orchestrate', async (req, res) => {
  try {
    const {
      userInput,
      channel = 'PARTNER_PORTAL',
      sessionId = `srv_${Date.now()}`,
      apiKey,
      preferredMode = 'GEMINI_INTERACTIONS_API',
      previousInteractionId,
    } = req.body || {};

    const resolvedKey =
      apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const record = await executeNexusOrchestration({
      userInput: String(userInput || ''),
      channel: channel as OmnichannelSource,
      sessionId: String(sessionId),
      apiKey: resolvedKey,
      preferredMode,
      previousInteractionId,
    });

    res.json(record);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erro interno na orquestração.';
    res.status(400).json({ error: message });
  }
});

const PORT = Number(process.env.PORT || 3001);
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(
      `[Nexus Orchestrator Server] Escutando em http://localhost:${PORT} (Model: gemini-3.8-flash)`
    );
  });
}

export default app;
