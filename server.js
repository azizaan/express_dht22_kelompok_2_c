const express = require("express");
const path = require("path");
const db = require("./db"); // Mengimpor koneksi database dari db.js

const app = express();
const PORT = 3000;

// Middleware untuk memproses JSON dan menyajikan file statis dari folder public
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// -----------------------------------------------------------------------------
// REST API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. POST /api/readings - Menerima data sensor dari perangkat/simulator
app.post("/api/readings", (req, res) => {
  const { device_id, suhu, kelembapan } = req.body;

  // Validasi: Cek tipe data dan batasan nilai (suhu: -40 s.d 80, kelembapan: 0 s.d 100)
  if (
    typeof suhu !== "number" ||
    typeof kelembapan !== "number" ||
    isNaN(suhu) ||
    isNaN(kelembapan) ||
    suhu < -40 ||
    suhu > 80 ||
    kelembapan < 0 ||
    kelembapan > 100
  ) {
    return res.status(400).json({
      error:
        "Data tidak valid. Suhu harus (-40 s.d 80°C) dan kelembapan (0 s.d 100%).",
    });
  }

  try {
    const stmt = db.prepare(
      "INSERT INTO readings (device_id, suhu, kelembapan) VALUES (?, ?, ?)",
    );
    const result = stmt.run(device_id || "GH-01", suhu, kelembapan);

    const newReading = db
      .prepare("SELECT * FROM readings WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json(newReading);
  } catch (err) {
    return res.status(500).json({ error: "Gagal menyimpan data ke database." });
  }
});

// 2. GET /api/readings/latest - Ambil 1 data terbaru untuk kartu indikator
app.get("/api/readings/latest", (req, res) => {
  try {
    const latest = db
      .prepare("SELECT * FROM readings ORDER BY id DESC LIMIT 1")
      .get();

    if (!latest) {
      return res.status(404).json({ message: "Belum ada data sensor." });
    }

    return res.json(latest);
  } catch (err) {
    return res.status(500).json({ error: "Gagal mengambil data terbaru." });
  }
});

// 3. GET /api/readings?limit=20 - Ambil N data terakhir untuk grafik & tabel
app.get("/api/readings", (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  try {
    const rows = db
      .prepare("SELECT * FROM readings ORDER BY id DESC LIMIT ?")
      .all(limit);

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Gagal mengambil riwayat data." });
  }
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
});