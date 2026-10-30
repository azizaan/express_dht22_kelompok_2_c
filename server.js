const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Inisialisasi Socket.IO
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Notifikasi saat client dashboard terhubung via WebSocket
io.on('connection', (socket) => {
  console.log('⚡ Dashboard terhubung via WebSocket:', socket.id);
});

// Endpoint POST /api/readings
app.post('/api/readings', (req, res) => {
  const { device_id, suhu, kelembapan } = req.body;

  if (
    typeof suhu !== 'number' ||
    typeof kelembapan !== 'number' ||
    isNaN(suhu) ||
    isNaN(kelembapan) ||
    suhu < -40 ||
    suhu > 80 ||
    kelembapan < 0 ||
    kelembapan > 100
  ) {
    return res.status(400).json({ error: 'Data sensor tidak valid.' });
  }

  try {
    const stmt = db.prepare('INSERT INTO readings (device_id, suhu, kelembapan) VALUES (?, ?, ?)');
    const result = stmt.run(device_id || 'GH-01', suhu, kelembapan);

    const newReading = db.prepare('SELECT * FROM readings WHERE id = ?').get(result.lastInsertRowid);

    // 🚀 EMIT DATA REAL-TIME KE DASHBOARD VIA WEBSOCKET
    io.emit('new_reading', newReading);

    return res.status(201).json(newReading);
  } catch (err) {
    return res.status(500).json({ error: 'Gagal menyimpan data.' });
  }
});

// REST API pendukung tetap dipertahankan
app.get('/api/readings/latest', (req, res) => {
  const latest = db.prepare('SELECT * FROM readings ORDER BY id DESC LIMIT 1').get();
  res.json(latest || {});
});

app.get('/api/readings', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const rows = db.prepare('SELECT * FROM readings ORDER BY id DESC LIMIT ?').all(limit);
  res.json(rows);
});

// 4. GET /api/stats - Kalkulasi statistik (AVG, MIN, MAX) suhu & kelembapan
app.get("/api/stats", (req, res) => {
  try {
    const stats = db
      .prepare(
        `
        SELECT 
          ROUND(AVG(suhu), 1) AS avg_suhu,
          MIN(suhu) AS min_suhu,
          MAX(suhu) AS max_suhu,
          ROUND(AVG(kelembapan), 1) AS avg_kelembapan,
          MIN(kelembapan) AS min_kelembapan,
          MAX(kelembapan) AS max_kelembapan
        FROM readings
      `,
      )
      .get();

    return res.json(stats);
  } catch (err) {
    return res.status(500).json({ error: "Gagal menghitung statistik." });
  }
});

// BONUS: GET /api/readings/export - ekspor seluruh riwayat ke file CSV
app.get("/api/readings/export", (req, res) => {
  try {
    const rows = db
      .prepare(
        "SELECT id, device_id, suhu, kelembapan, created_at FROM readings ORDER BY id DESC",
      )
      .all();

    // device_id dibungkus tanda kutip agar koma di dalamnya tidak merusak kolom
    const quote = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const header = "id,device_id,suhu,kelembapan,created_at";
    const lines = rows.map((r) =>
      [r.id, quote(r.device_id), r.suhu, r.kelembapan, r.created_at].join(","),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="readings.csv"');
    return res.send([header, ...lines].join("\n"));
  } catch (err) {
    return res.status(500).json({ error: "Gagal mengekspor data." });
  }
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
// Jalankan 'server', bukan 'app'
server.listen(PORT, () => {
  console.log(`Server & WebSocket berjalan di http://localhost:${PORT}`);
});