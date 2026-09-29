import express from 'express';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Background Proxy Session Store
interface ProxySession {
  id: string;
  configName: string;
  protocol: string;
  server: string;
  port: number;
  startedAt: number;
  lastPingMs: number | null;
  bytesDown: number;
  bytesUp: number;
  status: 'running' | 'stopped';
}

let activeSession: ProxySession | null = null;

// Ping a host and port via real TCP socket connection
app.post('/api/proxy/ping', (req, res) => {
  const { host, port = 443, timeout = 4000 } = req.body;

  if (!host) {
    return res.status(400).json({ ok: false, error: 'Host is required' });
  }

  const cleanHost = String(host).replace(/^\[|\]$/g, '').trim();
  const targetPort = Number(port) || 443;
  const start = Date.now();

  const socket = net.createConnection({ host: cleanHost, port: targetPort, timeout }, () => {
    const latency = Date.now() - start;
    socket.destroy();
    if (activeSession && activeSession.status === 'running') {
      activeSession.lastPingMs = latency;
    }
    return res.json({ ok: true, latency, host: cleanHost, port: targetPort });
  });

  let responded = false;

  socket.on('error', (err) => {
    if (responded) return;
    responded = true;
    socket.destroy();
    return res.json({ ok: false, error: err.message, latency: null, host: cleanHost, port: targetPort });
  });

  socket.on('timeout', () => {
    if (responded) return;
    responded = true;
    socket.destroy();
    return res.json({ ok: false, error: 'Connection timeout', latency: null, host: cleanHost, port: targetPort });
  });
});

// Session Management for Background Runner
app.get('/api/proxy/session', (_req, res) => {
  if (!activeSession) {
    return res.json({ active: false, session: null });
  }
  const uptimeSeconds = Math.floor((Date.now() - activeSession.startedAt) / 1000);
  return res.json({
    active: activeSession.status === 'running',
    session: {
      ...activeSession,
      uptimeSeconds,
    },
  });
});

app.post('/api/proxy/session/start', (req, res) => {
  const { configName = 'Chained Proxy', protocol = 'vless', server = '127.0.0.1', port = 443 } = req.body;

  activeSession = {
    id: `sess_${Date.now()}`,
    configName,
    protocol,
    server,
    port: Number(port) || 443,
    startedAt: Date.now(),
    lastPingMs: null,
    bytesDown: Math.floor(Math.random() * 2048) + 1024,
    bytesUp: Math.floor(Math.random() * 1024) + 512,
    status: 'running',
  };

  return res.json({ ok: true, session: activeSession });
});

app.post('/api/proxy/session/stop', (_req, res) => {
  if (activeSession) {
    activeSession.status = 'stopped';
  }
  return res.json({ ok: true, message: 'Session stopped' });
});

// Fetch subscription content with custom UA and follow redirects
app.get('/api/proxy/fetch-sub', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing subscription URL' });
  }

  try {
    const parsed = new URL(targetUrl);
    parsed.hash = '';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'v2rayNG/1.8.5',
        'Accept': '*/*',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: `Remote server returned ${response.status} ${response.statusText}`,
      });
    }

    const text = await response.text();
    return res.json({ ok: true, data: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch subscription: ' + msg });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Proxy Builder Android Backend', timestamp: Date.now() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In dev: mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In prod: serve built files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ProxyBuilder Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
