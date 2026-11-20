const crypto = require('node:crypto');

const isProd = process.env.NODE_ENV === 'production';

function secret(name, fallbackLabel) {
  const v = process.env[name];
  if (v) return v;
  if (isProd) throw new Error(`${name} es obligatorio en producción`);
  console.warn(`[config] ${name} no definido: se usa un valor aleatorio (${fallbackLabel})`);
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  isProd,
  port: Number(process.env.PORT) || 3000,
  jwtSecret: secret('JWT_SECRET', 'las sesiones caducan al reiniciar'),
  adminUsers: (process.env.ADMIN_USERS || 'Robert,Monica').split(',').map((s) => s.trim()).filter(Boolean),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  vapiToken: process.env.VAPI_WEBHOOK_TOKEN || '',
  corsOrigin: process.env.CORS_ORIGIN || '',
};
