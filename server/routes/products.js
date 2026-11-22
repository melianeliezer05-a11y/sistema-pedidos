const express = require('express');
const crypto = require('node:crypto');
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

function genId(prefix = 'p') {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function validateRecipe(recipe, extras, ings) {
  if (!recipe || Object.keys(recipe).length === 0) return 'La receta debe tener al menos un ingrediente';
  for (const [id, qty] of Object.entries(recipe)) {
    if (!ings[id]) return `Ingrediente desconocido en receta: ${id}`;
    if (!Number.isFinite(qty) || qty <= 0) return `Cantidad inválida para ${id}`;
  }
  if (extras) {
    for (const ex of extras) {
      if (!ex.id || !ex.name || !ex.ingredient || !Number.isFinite(ex.price) || !Number.isFinite(ex.qty) || ex.qty <= 0) {
        return 'Extra inválido (falta id, name, ingredient, price o qty)';
      }
      if (!ings[ex.ingredient]) return `Ingrediente de extra desconocido: ${ex.ingredient}`;
    }
  }
  return null;
}

router.post('/admin', requireAdmin, (req, res) => {
  const ings = ingredientMap();
  const { name, emoji, price, description, recipe, removable, extras } = req.body || {};

  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
  if (!emoji || !emoji.trim()) return res.status(400).json({ error: 'El emoji es obligatorio' });
  if (!Number.isFinite(price) || price < 0 || price > 1000) return res.status(400).json({ error: 'Precio no válido' });

  const recipeObj = recipe || {};
  const removableArr = Array.isArray(removable) ? removable : [];
  const extrasArr = Array.isArray(extras) ? extras : [];

  const err = validateRecipe(recipeObj, extrasArr, ings);
  if (err) return res.status(400).json({ error: err });

  for (const id of removableArr) {
    if (!recipeObj[id]) return res.status(400).json({ error: `Removible ${id} no está en la receta` });
  }

  const id = genId();
  db.prepare(`INSERT INTO products (id, name, emoji, price, description, recipe_json, removable_json, extras_json, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`).run(
    id,
    name.trim().slice(0, 80),
    emoji.trim().slice(0, 4),
    +price.toFixed(2),
    (description || '').trim().slice(0, 300),
    JSON.stringify(recipeObj),
    JSON.stringify(removableArr),
    JSON.stringify(extrasArr)
  );

  res.json({ ok: true, id });
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

router.delete('/admin/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Producto no existe' });
  // Soft delete - solo desactivar
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
