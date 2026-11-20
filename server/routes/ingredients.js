const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();
const MAX_ADJUST = 10_000;

router.get('/', requireAdmin, (_req, res) => {
  res.json({ ingredients: db.prepare('SELECT * FROM ingredients ORDER BY name').all() });
});

router.patch('/:id/stock', requireAdmin, (req, res) => {
  const delta = Number(req.body?.delta);
  if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > MAX_ADJUST) return res.status(400).json({ error: 'Cantidad no válida' });
  const ing = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id);
  if (!ing) return res.status(404).json({ error: 'Ingrediente no existe' });
  const stock = Math.max(0, ing.stock + delta);
  const applied = stock - ing.stock;
  const reason = String(req.body?.reason || (delta > 0 ? 'entrada' : 'salida')).slice(0, 40);
  db.transaction(() => {
    db.prepare('UPDATE ingredients SET stock = ? WHERE id = ?').run(stock, ing.id);
    db.prepare('INSERT INTO inventory_movements (ingredient_id, delta, reason) VALUES (?, ?, ?)').run(ing.id, applied, reason);
  })();
  res.json({ ok: true, ingredient: { ...ing, stock } });
});

router.patch('/:id/threshold', requireAdmin, (req, res) => {
  const v = Number(req.body?.minStock);
  if (!Number.isFinite(v) || v < 0 || v > MAX_ADJUST) return res.status(400).json({ error: 'Valor no válido' });
  const info = db.prepare('UPDATE ingredients SET min_stock = ? WHERE id = ?').run(v, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Ingrediente no existe' });
  res.json({ ok: true });
});

router.get('/movements', requireAdmin, (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const movements = db.prepare(`SELECT m.*, i.name AS ingredient_name, i.emoji AS ingredient_emoji, i.unit
    FROM inventory_movements m LEFT JOIN ingredients i ON i.id = m.ingredient_id
    ORDER BY m.created_at DESC, m.id DESC LIMIT ?`).all(limit).map((m) => ({ ...m, created_at: `${m.created_at.replace(' ', 'T')}Z` }));
  res.json({ movements });
});

module.exports = router;
