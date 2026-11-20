const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../auth');
const { printTicket } = require('../printer');
const { formatTicket } = require('../lib/ticket');
const { mapOrder } = require('../lib/orders');

const router = express.Router();

router.post('/:id', requireAdmin, async (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Pedido no existe' });
    const order = mapOrder(row);
    const print = await printTicket(order.id, formatTicket(order));
    if (print.ok) db.prepare("UPDATE orders SET printed_at = datetime('now') WHERE id = ?").run(order.id);
    res.json({ print });
  } catch (e) { next(e); }
});

module.exports = router;
