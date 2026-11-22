const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();
const MAX_ADJUST = 10_000;

function genId() {
  return `ing-${crypto.randomBytes(4).toString('hex')}`;
}

router.get('/', requireAdmin, (_req, res) => {
  res.json({ ingredients: db.prepare('SELECT * FROM ingredients ORDER BY name').all() });
});

router.post('/', requireAdmin, (req, res) => {
  const { name, emoji, stock, minStock, unit } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
  if (!emoji || !emoji.trim()) return res.status(400).json({ error: 'El emoji es obligatorio' });
  const s = Number(stock ?? 0);
  const m = Number(minStock ?? 0);
  if (!Number.isFinite(s) || s < 0 || s > MAX_ADJUST) return res.status(400).json({ error: 'Stock no válido' });
  if (!Number.isFinite(m) || m < 0 || m > MAX_ADJUST) return res.status(400).json({ error: 'Stock mínimo no válido' });
  const u = (unit || 'u').trim().slice(0, 10);

  const id = genId();
  db.prepare('INSERT INTO ingredients (id, name, emoji, stock, min_stock, unit) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name.trim().slice(0, 60), emoji.trim().slice(0, 4), s, m, u);

  res.json({ ok: true, id });
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

router.delete('/:id', requireAdmin, (req, res) => {
  const ing = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id);
  if (!ing) return res.status(404).json({ error: 'Ingrediente no existe' });
  // Verificar que no se usa en recetas
  const used = db.prepare(`SELECT id FROM products WHERE recipe_json LIKE ?`).get(`%"${req.params.id}"%`);
  if (used) return res.status(400).json({ error: 'No se puede borrar: se usa en al menos un producto' });
  db.prepare('DELETE FROM ingredients WHERE id = ?').run(req.params.id);
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
