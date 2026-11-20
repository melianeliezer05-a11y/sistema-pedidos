const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');

process.env.DB_PATH = path.join(os.tmpdir(), `sp-test-${process.pid}-${Date.now()}.db`);
process.env.NODE_ENV = 'test';
process.env.PRINTER_MODE = 'none';

const db = require('../db');
require('../seed')();
const { createAndPrint, setStatus, OrderError } = require('../lib/orders');

const stock = (id) => db.prepare('SELECT stock FROM ingredients WHERE id = ?').get(id).stock;
const item = (productId, quantity = 1, extra = {}) => ({ productId, quantity, removed: [], extras: [], ...extra });

test('crear pedido descuenta stock y calcula el total en servidor', async () => {
  const before = stock('pan');
  const { order } = await createAndPrint({ customerName: 'Ana', source: 'web', idPrefix: 'ORD', reason: 'venta', items: [item('burger-clasica', 2)] });
  assert.equal(order.total, 17);
  assert.equal(stock('pan'), before - 2);
});

test('cancelar devuelve exactamente el stock vendido', async () => {
  const pan = stock('pan'), queso = stock('queso');
  const { order } = await createAndPrint({ customerName: 'Luis', source: 'web', idPrefix: 'ORD', reason: 'venta', items: [item('burger-clasica', 1, { removed: ['queso'], extras: ['extra-tocino'] })] });
  assert.equal(stock('queso'), queso);
  assert.equal(stock('pan'), pan - 1);
  setStatus(order.id, 'cancelled');
  assert.equal(stock('pan'), pan);
  assert.throws(() => setStatus(order.id, 'preparing'), OrderError);
});

test('rechaza pedidos vacíos, productos falsos y stock insuficiente', async () => {
  await assert.rejects(createAndPrint({ customerName: 'x', source: 'web', idPrefix: 'ORD', reason: 'venta', items: [] }), OrderError);
  await assert.rejects(createAndPrint({ customerName: 'x', source: 'web', idPrefix: 'ORD', reason: 'venta', items: [item('no-existe')] }), OrderError);
  await assert.rejects(createAndPrint({ customerName: 'x', source: 'web', idPrefix: 'ORD', reason: 'venta', items: [item('burger-clasica', 9999)] }), OrderError);
});

test('un pedido entregado no se puede cancelar', async () => {
  const { order } = await createAndPrint({ customerName: 'Eva', source: 'web', idPrefix: 'ORD', reason: 'venta', items: [item('bebida')] });
  setStatus(order.id, 'delivered');
  assert.throws(() => setStatus(order.id, 'cancelled'), OrderError);
});
