const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../auth');
const { parseProduct } = require('../lib/orders');

const router = express.Router();

const ingredientMap = () => Object.fromEntries(db.prepare('SELECT * FROM ingredients').all().map((i) => [i.id, i]));

function availableUnits(product, ings) {
  const counts = Object.entries(product.recipe).map(([id, qty]) => (ings[id] && qty > 0 ? Math.floor(ings[id].stock / qty) : 0));
  return counts.length ? Math.max(0, Math.min(...counts)) : 0;
}

const present = (p, ings) => ({
  ...p,
  removable: p.removable.map((id) => ({ id, name: ings[id]?.name || id })),
  availableUnits: availableUnits(p, ings),
});

router.get('/', (_req, res) => {
  const ings = ingredientMap();
  const products = db.prepare('SELECT * FROM products WHERE active = 1').all().map(parseProduct).map((p) => present(p, ings));
  res.json({ products });
});

router.get('/admin', requireAdmin, (_req, res) => {
  const ings = ingredientMap();
  const products = db.prepare('SELECT * FROM products').all().map(parseProduct).map((p) => ({
    ...present(p, ings),
    recipeDetail: Object.entries(p.recipe).map(([id, qty]) => ({ id, qty, name: ings[id]?.name || id, emoji: ings[id]?.emoji || '' })),
  }));
  res.json({ products });
});

router.patch('/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Producto no existe' });
  const { name, price, description, active } = req.body || {};
  const next = {
    name: name === undefined ? row.name : String(name).trim().slice(0, 80),
    price: price === undefined ? row.price : Number(price),
    description: description === undefined ? row.description : String(description).trim().slice(0, 300),
    active: active === undefined ? row.active : active ? 1 : 0,
  };
  if (!next.name) return res.status(400).json({ error: 'El nombre no puede estar vacío' });
  if (!Number.isFinite(next.price) || next.price < 0 || next.price > 1000) return res.status(400).json({ error: 'Precio no válido' });
  db.prepare('UPDATE products SET name = ?, price = ?, description = ?, active = ? WHERE id = ?')
    .run(next.name, +next.price.toFixed(2), next.description, next.active, row.id);
  res.json({ ok: true });
});

module.exports = router;
