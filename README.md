# Greenhouse IoT Monitoring System

Sistem pemantauan suhu dan kelembapan secara real-time berbasis **Express.js**, **SQLite**, **Socket.IO (WebSocket)**, dan **Chart.js** yang terhubung dengan perangkat keras **WeMos D1 Mini (ESP8266) + DHT22** serta simulator sensor.

## 👥 Identitas Kelompok

| No | Nama Anggota | NIM |
|---|---|---|
| 1 | ABDILLAH AZIZ PUTRA SUSAN | E41241208 |
| 2 | JAVIER DAVID LEVI BUTARBUTAR | E41241055 |
| 3 | SHERGI REYHAN AFFARIZQI FLORESTA | E41240991 |
| 4 | ALIF MICCA MUHAMMAD | E41241046 |
| 5 | YOHANES FABIAN SURYOLAKSONO | E41241221 |

**Nama Repository:** `express_dht22_kelompok_2_c`

---

## 🚀 Fitur Utama

- **Real-Time Monitoring**: Pemantauan suhu dan kelembapan secara langsung melalui WebSocket (`socket.io`) tanpa perlu melakukan reload halaman.
- **Multi-Device Support**: Mendukung pemantauan dan filter data berdasarkan perangkat, yaitu `GH-ESP8266` (perangkat asli) dan `GH-01` (simulator).
- **Interactive Chart & Table**: Menampilkan grafik dan tabel riwayat 20 data terakhir menggunakan Chart.js dengan penyesuaian waktu ke WIB (`Asia/Jakarta`).
- **Export CSV**: Mengunduh seluruh riwayat data dari database SQLite ke dalam format `.csv`.
- **Status Indikator**: Mendeteksi status perangkat (Online/Offline) serta mengubah warna kartu suhu apabila suhu melebihi 35°C.

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Kegunaan |
|---|---|
| Node.js | Runtime JavaScript |
| Express.js | Backend dan REST API |
| SQLite | Penyimpanan database |
| Socket.IO | Komunikasi real-time menggunakan WebSocket |
| Chart.js | Visualisasi grafik suhu dan kelembapan |
| HTML, CSS, JavaScript | Pengembangan antarmuka dashboard |
| ESP8266 (WeMos D1 Mini) | Mikrokontroler pengirim data sensor |
| DHT22 | Sensor suhu dan kelembapan |

---

## 📋 Daftar API Endpoints

| Method | Endpoint | Deskripsi | Format Request / Query |
|---|---|---|---|
| `POST` | `/api/readings` | Menerima data baru dari sensor atau simulator dan mengirimkannya melalui WebSocket | `{"device_id":"GH-ESP8266","suhu":28.5,"kelembapan":60.2}` |
| `GET` | `/api/readings/latest` | Mengambil satu data pembacaan sensor terbaru | - |
| `GET` | `/api/readings` | Mengambil riwayat data pembacaan sensor | `?limit=20` (default: 20) |
| `GET` | `/api/stats` | Mengambil statistik suhu dan kelembapan (AVG, MIN, MAX) | - |
| `GET` | `/api/readings/export` | Mengunduh seluruh riwayat data dalam format CSV | - |

---

## 💻 Cara Menjalankan Aplikasi

### 1. Prasyarat Sistem

Pastikan perangkat sudah terinstal:

- [Node.js](https://nodejs.org/)
- npm (sudah termasuk dalam instalasi Node.js)
- Git (opsional, untuk melakukan clone repository)

### 2. Clone Repository

Buka terminal atau Command Prompt, kemudian jalankan:

```bash
git clone https://github.com/USERNAME/express_dht22_kelompok_2_c.git
```

Masuk ke direktori proyek:

```bash
cd express_dht22_kelompok_2_c
```

> Ganti `USERNAME` dengan username GitHub pemilik repository.

### 3. Instalasi Dependensi

Jalankan perintah berikut untuk menginstal seluruh dependensi:

```bash
npm install
```

### 4. Menjalankan Server Application

Jalankan server Express.js dan Socket.IO menggunakan perintah:

```bash
node server.js
```

Jika berhasil, server akan berjalan di:

```text
http://localhost:3000
```

Buka alamat tersebut melalui browser untuk mengakses dashboard monitoring.

### 5. Menjalankan Simulator Device (Opsional)

Untuk menguji sistem tanpa menggunakan perangkat keras ESP8266, buka terminal baru pada direktori proyek dan jalankan:

```bash
node simulator.js
```

Simulator akan mengirimkan data dummy suhu dan kelembapan ke server melalui HTTP POST.

---

## 📂 Struktur Repositori

```text
express_dht22_kelompok_2_c/
│
├── .gitignore
├── db.js
├── server.js
├── simulator.js
├── package.json
├── package-lock.json
├── README.md
│
├── screenshots/
│   ├── dashboard.png
│   └── post-test.png
│
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

### Penjelasan Struktur File

| File / Folder | Deskripsi |
|---|---|
| `.gitignore` | Mengabaikan file atau folder tertentu seperti `node_modules` dan file database `*.db`. |
| `db.js` | Konfigurasi database dan pembuatan skema SQLite. |
| `server.js` | Menjalankan Express.js REST API dan Socket.IO server. |
| `simulator.js` | Simulator pengiriman data sensor menggunakan HTTP POST. |
| `package.json` | Menyimpan informasi proyek dan daftar dependensi. |
| `package-lock.json` | Mengunci versi dependensi proyek. |
| `README.md` | Dokumentasi proyek. |
| `screenshots/` | Menyimpan tangkapan layar dashboard dan pengujian endpoint API. |
| `public/index.html` | Struktur halaman dashboard utama. |
| `public/style.css` | Mengatur tampilan dan desain dashboard. |
| `public/app.js` | Mengatur logika frontend, komunikasi WebSocket, dan visualisasi Chart.js. |

---

## 📸 Dokumentasi Aplikasi

### 1. Dashboard Monitoring

Menampilkan informasi suhu, kelembapan, status perangkat, grafik, serta tabel riwayat pembacaan sensor.

![Dashboard Monitoring](screenshots/dashboard.png)

### 2. Pengujian API

Dokumentasi pengujian endpoint API untuk memastikan server dapat menerima data pembacaan sensor dengan benar.

![API Testing](screenshots/post-test.png)

---

## 📡 Alur Kerja Sistem

1. Sensor DHT22 membaca nilai suhu dan kelembapan lingkungan.
2. WeMos D1 Mini (ESP8266) mengirimkan hasil pembacaan sensor ke server melalui HTTP POST.
3. Server Express.js menerima data dan menyimpannya ke database SQLite.
4. Socket.IO mengirimkan pembaruan data secara real-time ke seluruh client yang terhubung.
5. Dashboard menampilkan data terbaru dalam bentuk informasi, grafik, dan tabel menggunakan Chart.js.
6. Pengguna dapat melihat statistik serta mengunduh seluruh riwayat pembacaan sensor dalam format CSV.

---

## 👨‍💻 Pengembangan

Proyek ini dikembangkan sebagai implementasi sistem Internet of Things (IoT) untuk pemantauan kondisi lingkungan greenhouse dengan mengintegrasikan perangkat keras, backend, database, dan frontend dalam satu sistem monitoring.

**Repository:** `express_dht22_kelompok_2_c`
