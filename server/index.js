require('dotenv').config();
const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { rateLimit } = require('./lib/rateLimit');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'",
  });
  next();
});
app.use(cors(config.corsOrigin ? { origin: config.corsOrigin.split(',') } : { origin: false }));
app.use(express.json({ limit: '100kb' }));

require('./seed')();

app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.use('/api', rateLimit({ windowMs: 60_000, max: 240 }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/products', require('./routes/products'));
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/print', require('./routes/print'));
app.use('/api/vapi', require('./routes/vapi'));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

const dist = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('/', (_req, res) => res.type('text').send('Interfaz sin compilar. Ejecuta: npm run build'));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON no válido' });
  console.error('[error]', err);
  res.status(500).json({ error: 'Error interno' });
});

app.listen(config.port, () => {
  console.log(`Servidor en http://localhost:${config.port}`);
  console.log(`Webhook Vapi: POST http://localhost:${config.port}/api/vapi/webhook`);
});
