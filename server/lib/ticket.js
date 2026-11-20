const { getSetting } = require('../db');

const WIDTH = 32;
const RULE_THICK = '='.repeat(WIDTH);
const RULE_THIN = '-'.repeat(WIDTH);
const money = (n) => `$${Number(n).toFixed(2)}`;
const CHANNEL = { web: 'WEB', voice: 'VOZ' };

function formatTicket(order) {
  const name = getSetting('restaurantName', 'Restaurante').toUpperCase();
  const lines = [RULE_THICK, name.padStart(Math.floor((WIDTH + name.length) / 2)), RULE_THICK];
  lines.push(`Ticket : ${order.id}`);
  lines.push(`Canal  : ${CHANNEL[order.source] || order.source}`);
  lines.push(`Fecha  : ${new Date(order.createdAt).toLocaleString('es-ES')}`);
  lines.push(`Cliente: ${order.customerName}`, RULE_THIN);
  for (const it of order.items) {
    lines.push(`${it.quantity}x ${it.name}  ${money(it.lineTotal)}`);
    if (it.removed?.length) lines.push(`   SIN: ${(it.removedNames?.length ? it.removedNames : it.removed).join(', ')}`);
    if (it.extras?.length) lines.push(`   EXTRA: ${it.extras.map((e) => e.name).join(', ')}`);
    if (it.comments) lines.push(`   NOTA: ${it.comments}`);
  }
  lines.push(RULE_THIN, `TOTAL: ${money(order.total)}`, RULE_THICK, '¡Gracias por su pedido!');
  return lines.join('\n');
}

module.exports = { formatTicket };
