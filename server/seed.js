const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { adminUsers, adminPassword } = require('./config');
const DEFAULT_INGREDIENTS = [
  { id: 'pan', name: 'Pan de hamburguesa', emoji: '🍞', stock: 40, minStock: 8, unit: 'u' },
  { id: 'carne', name: 'Carne de res', emoji: '🥩', stock: 30, minStock: 6, unit: 'u' },
  { id: 'pollo', name: 'Pollo', emoji: '🍗', stock: 25, minStock: 5, unit: 'u' },
  { id: 'queso', name: 'Queso', emoji: '🧀', stock: 35, minStock: 7, unit: 'u' },
  { id: 'lechuga', name: 'Lechuga', emoji: '🥬', stock: 20, minStock: 4, unit: 'u' },
  { id: 'tomate', name: 'Tomate', emoji: '🍅', stock: 22, minStock: 4, unit: 'u' },
  { id: 'cebolla', name: 'Cebolla', emoji: '🧅', stock: 18, minStock: 4, unit: 'u' },
  { id: 'tocino', name: 'Tocino', emoji: '🥓', stock: 15, minStock: 3, unit: 'u' },
  { id: 'pepinillo', name: 'Pepinillos', emoji: '🥒', stock: 12, minStock: 3, unit: 'u' },
  { id: 'papas', name: 'Papas fritas', emoji: '🍟', stock: 40, minStock: 10, unit: 'porción' },
  { id: 'bebida', name: 'Bebida (lata)', emoji: '🥤', stock: 50, minStock: 10, unit: 'u' }
];
const DEFAULT_PRODUCTS = [
  { id: 'burger-clasica', name: 'Hamburguesa Clásica', emoji: '🍔', price: 8.50, description: 'Carne de res, queso, lechuga, tomate y cebolla en pan suave.', recipe: { pan: 1, carne: 1, queso: 1, lechuga: 1, tomate: 1, cebolla: 1 }, removable: ['queso', 'lechuga', 'tomate', 'cebolla'], extras: [{ id: 'extra-queso', name: 'Queso extra', price: 0.75, ingredient: 'queso', qty: 1 }, { id: 'extra-tocino', name: 'Tocino', price: 1.00, ingredient: 'tocino', qty: 1 }, { id: 'extra-pepinillo', name: 'Pepinillos', price: 0.50, ingredient: 'pepinillo', qty: 1 }] },
  { id: 'burger-pollo', name: 'Hamburguesa de Pollo', emoji: '🍗', price: 7.50, description: 'Pollo a la plancha, queso, lechuga y tomate.', recipe: { pan: 1, pollo: 1, queso: 1, lechuga: 1, tomate: 1 }, removable: ['queso', 'lechuga', 'tomate'], extras: [{ id: 'extra-queso-p', name: 'Queso extra', price: 0.75, ingredient: 'queso', qty: 1 }, { id: 'extra-tocino-p', name: 'Tocino', price: 1.00, ingredient: 'tocino', qty: 1 }] },
  { id: 'papas', name: 'Papas Fritas', emoji: '🍟', price: 3.00, description: 'Porción de papas fritas crujientes.', recipe: { papas: 1 }, removable: [], extras: [] },
  { id: 'bebida', name: 'Bebida', emoji: '🥤', price: 2.00, description: 'Lata de refresco frío.', recipe: { bebida: 1 }, removable: [], extras: [] }
];
function seedAdmins() {
  const exists = db.prepare('SELECT 1 FROM users WHERE username = ?');
  const insert = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')");
  const missing = adminUsers.filter((u) => !exists.get(u));
  if (!missing.length) return;
  let password = adminPassword;
  if (!password) {
    password = crypto.randomBytes(9).toString('base64url');
    console.warn(`[seed] ADMIN_PASSWORD no definido. Contraseña inicial generada para ${missing.join(', ')}: ${password}`);
  }
  const hash = bcrypt.hashSync(password, 10);
  db.transaction(() => { for (const u of missing) insert.run(u, hash); })();
  console.log(`[seed] Usuarios creados: ${missing.join(', ')}`);
}

function seed() {
  seedAdmins();
  const ingCount = db.prepare('SELECT COUNT(*) AS n FROM ingredients').get().n;
  if (ingCount === 0) {
    const insert = db.prepare('INSERT INTO ingredients (id, name, emoji, stock, min_stock, unit) VALUES (?, ?, ?, ?, ?, ?)');
    const tx = db.transaction((rows) => { for (const i of rows) insert.run(i.id, i.name, i.emoji, i.stock, i.minStock, i.unit); });
    tx(DEFAULT_INGREDIENTS);
  }
  const prodCount = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (prodCount === 0) {
    const insert = db.prepare(`INSERT INTO products (id, name, emoji, price, description, recipe_json, removable_json, extras_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const tx = db.transaction((rows) => { for (const p of rows) insert.run(p.id, p.name, p.emoji, p.price, p.description, JSON.stringify(p.recipe), JSON.stringify(p.removable), JSON.stringify(p.extras)); });
    tx(DEFAULT_PRODUCTS);
  }
  const settingCount = db.prepare('SELECT COUNT(*) AS n FROM settings').get().n;
  if (settingCount === 0) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('restaurantName', 'Restaurante Demo');
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('clientAlertUnits', '5');
  }
}
module.exports = seed;
