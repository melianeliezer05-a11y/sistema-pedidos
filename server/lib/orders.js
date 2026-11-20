const crypto = require('node:crypto');
const db = require('../db');
const { formatTicket } = require('./ticket');
const { printTicket } = require('../printer');

const MAX_ITEMS = 30;
const MAX_QTY = 20;
const STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
const SALE_REASONS = ['venta', 'voz'];

class OrderError extends Error {}

const parseProduct = (row) => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji,
  price: row.price,
  description: row.description,
  active: row.active === 1,
  recipe: JSON.parse(row.recipe_json),
  removable: JSON.parse(row.removable_json),
  extras: JSON.parse(row.extras_json),
});

const iso = (sqlite) => (sqlite ? `${sqlite.replace(' ', 'T')}Z` : null);

const mapOrder = (r) => ({
  id: r.id,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
  customerName: r.customer_name,
  source: r.source,
  items: JSON.parse(r.items_json),
  total: r.total,
  status: r.status,
  printedAt: iso(r.printed_at),
});

const newId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Valida el carrito contra el catálogo real. Nunca confía en precios del cliente. */
function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new OrderError('El pedido está vacío');
  if (rawItems.length > MAX_ITEMS) throw new OrderError(`Máximo ${MAX_ITEMS} líneas por pedido`);
  const products = Object.fromEntries(db.prepare('SELECT * FROM products').all().map((r) => [r.id, parseProduct(r)]));
  const ingNames = Object.fromEntries(db.prepare('SELECT id, name FROM ingredients').all().map((i) => [i.id, i.name]));

  return rawItems.map((it) => {
    const p = products[it?.productId];
    if (!p || !p.active) throw new OrderError(`Producto no disponible: ${it?.productId}`);
    const quantity = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(it.quantity)) || 1));
    const removed = [...new Set((Array.isArray(it.removed) ? it.removed : []).filter((id) => p.removable.includes(id)))];
    const extras = [...new Set(Array.isArray(it.extras) ? it.extras : [])].map((id) => {
      const ex = p.extras.find((e) => e.id === id);
      if (!ex) throw new OrderError(`Extra no válido: ${id}`);
      return ex;
    });
    const unitPrice = +(p.price + extras.reduce((s, e) => s + e.price, 0)).toFixed(2);
    return {
      product: p,
      line: {
        productId: p.id,
        name: p.name,
        emoji: p.emoji,
        unitPrice,
        quantity,
        removed,
        removedNames: removed.map((id) => ingNames[id] || id),
        extras: extras.map(({ id, name, price }) => ({ id, name, price })),
        comments: clean(it.comments, 200),
        lineTotal: +(unitPrice * quantity).toFixed(2),
      },
      extraDefs: extras,
    };
  });
}

function neededIngredients(normalized) {
  const needed = {};
  const add = (id, qty) => { needed[id] = (needed[id] || 0) + qty; };
  for (const { product, line, extraDefs } of normalized) {
    for (const [ingId, qty] of Object.entries(product.recipe)) if (!line.removed.includes(ingId)) add(ingId, qty * line.quantity);
    for (const ex of extraDefs) add(ex.ingredient, ex.qty * line.quantity);
  }
  return needed;
}

/** Crea el pedido y descuenta stock en una sola transacción (better-sqlite3 es síncrono: no hay carreras). */
const createOrder = db.transaction(({ items, customerName, source, idPrefix, reason }) => {
  const normalized = normalizeItems(items);
  const needed = neededIngredients(normalized);
  const stockStmt = db.prepare('SELECT * FROM ingredients WHERE id = ?');
  for (const [ingId, qty] of Object.entries(needed)) {
    const ing = stockStmt.get(ingId);
    if (!ing) throw new OrderError(`Ingrediente desconocido: ${ingId}`);
    if (qty > ing.stock) throw new OrderError(`No queda suficiente ${ing.name.toLowerCase()} para este pedido`);
  }
  const lines = normalized.map((n) => n.line);
  const order = {
    id: newId(idPrefix),
    createdAt: new Date().toISOString(),
    customerName: clean(customerName, 60) || (source === 'voice' ? 'Cliente voz' : 'Cliente web'),
    source,
    items: lines,
    total: +lines.reduce((s, l) => s + l.lineTotal, 0).toFixed(2),
    status: 'pending',
  };
  db.prepare('INSERT INTO orders (id, customer_name, source, items_json, total, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))')
    .run(order.id, order.customerName, order.source, JSON.stringify(order.items), order.total);
  const dec = db.prepare('UPDATE ingredients SET stock = stock - ? WHERE id = ?');
  const mov = db.prepare('INSERT INTO inventory_movements (ingredient_id, delta, reason, order_id) VALUES (?, ?, ?, ?)');
  for (const [ingId, qty] of Object.entries(needed)) { dec.run(qty, ingId); mov.run(ingId, -qty, reason, order.id); }
  return order;
});

async function createAndPrint(args) {
  const order = createOrder(args);
  const ticket = formatTicket(order);
  const print = await printTicket(order.id, ticket);
  if (print.ok) db.prepare("UPDATE orders SET printed_at = datetime('now') WHERE id = ?").run(order.id);
  return { order, ticket, print };
}

/** Cambia el estado. Cancelar devuelve el stock exacto que se descontó. */
const setStatus = db.transaction((id, status) => {
  if (!STATUSES.includes(status)) throw new OrderError('Estado no válido');
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!row) return null;
  if (row.status === 'cancelled') throw new OrderError('Un pedido cancelado no se puede reabrir');
  if (status === 'cancelled') {
    if (row.status === 'delivered') throw new OrderError('Un pedido entregado no se puede cancelar');
    const sold = db.prepare(`SELECT ingredient_id, -delta AS qty FROM inventory_movements WHERE order_id = ? AND reason IN (${SALE_REASONS.map(() => '?').join(',')})`).all(id, ...SALE_REASONS);
    for (const { ingredient_id, qty } of sold) {
      db.prepare('UPDATE ingredients SET stock = stock + ? WHERE id = ?').run(qty, ingredient_id);
      db.prepare("INSERT INTO inventory_movements (ingredient_id, delta, reason, order_id) VALUES (?, ?, 'cancelación', ?)").run(ingredient_id, qty, id);
    }
  }
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  return mapOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
});

module.exports = { OrderError, STATUSES, parseProduct, mapOrder, createAndPrint, setStatus };
