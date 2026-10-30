const Database = require("better-sqlite3");
const db = new Database("database.db");

// Inisialisasi tabel readings sesuai skema spesifikasi
// Di db.js, ubah default CURRENT_TIMESTAMP menjadi datetime lokal WIB
db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    suhu REAL,
    kelembapan REAL,
    created_at TEXT DEFAULT (datetime('now', '+7 hours'))
  )
`);

module.exports = db;
