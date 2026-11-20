const Database = require('better-sqlite3');
const path = require('node:path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin', created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS ingredients (id TEXT PRIMARY KEY, name TEXT NOT NULL, emoji TEXT NOT NULL DEFAULT '', stock REAL NOT NULL DEFAULT 0, min_stock REAL NOT NULL DEFAULT 0, unit TEXT NOT NULL DEFAULT 'u');
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, emoji TEXT NOT NULL DEFAULT '', price REAL NOT NULL, description TEXT NOT NULL DEFAULT '', recipe_json TEXT NOT NULL, removable_json TEXT NOT NULL DEFAULT '[]', extras_json TEXT NOT NULL DEFAULT '[]');
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')), customer_name TEXT NOT NULL, source TEXT NOT NULL, items_json TEXT NOT NULL, total REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending', printed_at TEXT);
CREATE TABLE IF NOT EXISTS inventory_movements (id INTEGER PRIMARY KEY AUTOINCREMENT, ingredient_id TEXT NOT NULL, delta REAL NOT NULL, reason TEXT NOT NULL, note TEXT, order_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
`);

function addColumn(table, column, ddl) {
  const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
  if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
}
addColumn('products', 'active', 'INTEGER NOT NULL DEFAULT 1');
addColumn('orders', 'updated_at', "TEXT NOT NULL DEFAULT ''");
db.exec("UPDATE orders SET updated_at = created_at WHERE updated_at = ''");

const getSetting = (key, fallback) => db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value ?? fallback;
const setSetting = (key, value) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));

module.exports = db;
module.exports.getSetting = getSetting;
module.exports.setSetting = setSetting;
