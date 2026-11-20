// Limitador en memoria por IP. shortcut: un solo proceso, sin Redis; si se escala a varias instancias, mover a almacén compartido.
function rateLimit({ windowMs, max, message = 'Demasiadas peticiones, espera un momento', countOnlyFailures = false }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) entry = { count: 0, reset: now + windowMs };
    hits.set(key, entry);
    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    if (countOnlyFailures) res.on('finish', () => { if (res.statusCode >= 400) entry.count += 1; });
    else entry.count += 1;
    next();
  };
}

module.exports = { rateLimit };
