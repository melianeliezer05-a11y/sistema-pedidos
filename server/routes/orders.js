const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../auth');
const { rateLimit } = require('../lib/rateLimit');
const { formatTicket } = require('../lib/ticket');
const { OrderError, STATUSES, mapOrder, createAndPrint, setStatus } = require('../lib/orders');

const router = express.Router();
const createLimit = rateLimit({ windowMs: 10 * 60_000, max: 15, message: 'Has hecho muchos pedidos seguidos. Prueba en unos minutos.' });

router.post('/', createLimit, async (req, res, next) => {
  try {
    const { items, customerName } = req.body || {};
    const { order, ticket, print } = await createAndPrint({ items, customerName, source: 'web', idPrefix: 'ORD', reason: 'venta' });
    res.status(201).json({ order, ticket, print });
  } catch (e) {
    if (e instanceof OrderError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

// Público: solo lo mínimo para seguir el estado (el id es aleatorio de 32 bits y no expone datos personales).
router.get('/:id/status', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No encontramos ese pedido' });
  const o = mapOrder(row);
  res.json({ id: o.id, status: o.status, createdAt: o.createdAt, total: o.total, items: o.items.map((i) => ({ name: i.name, emoji: i.emoji, quantity: i.quantity })) });
});

router.get('/', requireAdmin, (req, res) => {
  const status = STATUSES.includes(req.query.status) ? req.query.status : null;
  const rows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 200').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();
  res.json({ orders: rows.map(mapOrder) });
});

router.patch('/:id/status', requireAdmin, (req, res, next) => {
  try {
    const order = setStatus(req.params.id, req.body?.status);
    if (!order) return res.status(404).json({ error: 'Pedido no existe' });
    res.json({ order });
  } catch (e) {
    if (e instanceof OrderError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

router.get('/:id/ticket', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Pedido no existe' });
  res.json({ ticket: formatTicket(mapOrder(row)) });
});

module.exports = router;
