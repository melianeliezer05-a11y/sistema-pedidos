const express = require('express');
const { getSetting, setSetting } = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

const read = () => ({
  restaurantName: getSetting('restaurantName', 'Restaurante Demo'),
  clientAlertUnits: Number(getSetting('clientAlertUnits', '5')),
});

router.get('/', (_req, res) => res.json(read()));

router.put('/', requireAdmin, (req, res) => {
  const name = String(req.body?.restaurantName ?? '').trim().slice(0, 60);
  const alert = Math.floor(Number(req.body?.clientAlertUnits));
  if (!name) return res.status(400).json({ error: 'El nombre no puede estar vacío' });
  if (!Number.isFinite(alert) || alert < 1 || alert > 50) return res.status(400).json({ error: 'La alerta debe estar entre 1 y 50' });
  setSetting('restaurantName', name);
  setSetting('clientAlertUnits', alert);
  res.json(read());
});

module.exports = router;
