const crypto = require('node:crypto');
const express = require('express');
const { vapiToken } = require('../config');
const { OrderError, createAndPrint } = require('../lib/orders');

const router = express.Router();

const safeEqual = (a, b) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

router.post('/webhook', async (req, res, next) => {
  if (!vapiToken) return res.status(500).json({ ok: false, error: 'VAPI_WEBHOOK_TOKEN no configurado' });
  const provided = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!safeEqual(provided, vapiToken)) return res.status(401).json({ ok: false, error: 'Token inválido' });

  const { items, customerPhone, customerName } = req.body || {};
  try {
    const { order } = await createAndPrint({
      items,
      customerName: customerName || (customerPhone ? `Llamada ${customerPhone}` : ''),
      source: 'voice',
      idPrefix: 'VOC',
      reason: 'voz',
    });
    res.status(201).json({ ok: true, orderId: order.id, total: order.total, message: 'Pedido creado e impreso' });
  } catch (e) {
    if (e instanceof OrderError) return res.status(400).json({ ok: false, error: e.message });
    next(e);
  }
});

module.exports = router;
