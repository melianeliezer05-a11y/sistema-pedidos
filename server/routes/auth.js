const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign, requireAuth } = require('../auth');
const { rateLimit } = require('../lib/rateLimit');

const router = express.Router();
const failedLogins = rateLimit({ windowMs: 15 * 60_000, max: 8, countOnlyFailures: true, message: 'Demasiados intentos fallidos. Espera 15 minutos.' });

router.post('/login', failedLogins, (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  if (!username || !password) return res.status(400).json({ error: 'Escribe usuario y contraseña' });
  const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  res.json({ token: sign(user), user: { username: user.username, role: user.role } });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

module.exports = router;
