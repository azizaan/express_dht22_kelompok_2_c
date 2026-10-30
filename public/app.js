// let sensorChart = null;

// // Inisialisasi Grafik Chart.js
// function initChart() {
//   const ctx = document.getElementById('sensorChart').getContext('2d');
//   sensorChart = new Chart(ctx, {
//     type: 'line',
//     data: {
//       labels: [],
//       datasets: [
//         {
//           label: 'Suhu (°C)',
//           data: [],
//           borderColor: '#dc3545',
//           backgroundColor: 'rgba(220, 53, 69, 0.1)',
//           tension: 0.3,
//           fill: true
//         },
//         {
//           label: 'Kelembapan (%)',
//           data: [],
//           borderColor: '#17a2b8',
//           backgroundColor: 'rgba(23, 162, 184, 0.1)',
//           tension: 0.3,
//           fill: true
//         }
//       ]
//     },
//     options: {
//       responsive: true,
//       scales: {
//         x: { display: true, title: { display: true, text: 'Waktu' } },
//         y: { beginAtZero: false }
//       }
//     }
//   });
// }

// // Fungsi Mengambil Data Terbaru (Status Card & Online Status)
// async function fetchLatest() {
//   try {
//     const res = await fetch('/api/readings/latest');
//     if (!res.ok) return;
//     const data = await res.json();

//     const suhuEl = document.getElementById('val-suhu');
//     const kelembapanEl = document.getElementById('val-kelembapan');
//     const timeSuhuEl = document.getElementById('time-suhu');
//     const timeKelembapanEl = document.getElementById('time-kelembapan');
//     const suhuCard = document.getElementById('suhu-card');
//     const statusBadge = document.getElementById('device-status');

//     suhuEl.textContent = data.suhu;
//     kelembapanEl.textContent = data.kelembapan;

//     const formattedTime = new Date(data.created_at).toLocaleTimeString();
//     timeSuhuEl.textContent = formattedTime;
//     timeKelembapanEl.textContent = formattedTime;

//     // Perubahan Warna Kartu Suhu: Merah jika > 35°C, Hijau jika normal
//     if (data.suhu > 35) {
//       suhuCard.className = 'card card-hot';
//     } else {
//       suhuCard.className = 'card card-normal';
//     }

//     // Cek Status Online: Online jika data terakhir < 30 detik yang lalu
//     const lastDataTime = new Date(data.created_at).getTime();
//     const now = new Date().getTime();
//     const diffSeconds = (now - lastDataTime) / 1000;

//     if (diffSeconds < 30) {
//       statusBadge.textContent = 'Online';
//       statusBadge.className = 'status-badge online';
//     } else {
//       statusBadge.textContent = 'Offline';
//       statusBadge.className = 'status-badge offline';
//     }
//   } catch (err) {
//     console.error('Gagal mengambil data terbaru:', err);
//   }
// }

// // Fungsi Mengambil Riwayat Data untuk Grafik & Tabel
// async function fetchHistory() {
//   try {
//     const res = await fetch('/api/readings?limit=20');
//     if (!res.ok) return;
//     const data = await res.json();

//     // Data dari API berurut DESC, kita balik (reverse) agar grafik tampil dari kiri ke kanan (lama -> baru)
//     const sortedData = [...data].reverse();

//     // Update Grafik Chart.js (20 Data Terakhir)
//     const labels = sortedData.map(item => new Date(item.created_at).toLocaleTimeString());
//     const suhuData = sortedData.map(item => item.suhu);
//     const kelembapanData = sortedData.map(item => item.kelembapan);

//     sensorChart.data.labels = labels;
//     sensorChart.data.datasets[0].data = suhuData;
//     sensorChart.data.datasets[1].data = kelembapanData;
//     sensorChart.update();

//     // Update Tabel Riwayat (10 Data Terakhir)
//     const tbody = document.getElementById('table-body');
//     const latest10 = data.slice(0, 10); // Ambil 10 teratas (terbaru)

//     tbody.innerHTML = latest10.map(item => `
//       <tr>
//         <td>${item.device_id || 'GH-01'}</td>
//         <td>${item.suhu}</td>
//         <td>${item.kelembapan}</td>
//         <td>${new Date(item.created_at).toLocaleString()}</td>
//       </tr>
//     `).join('');
//   } catch (err) {
//     console.error('Gagal mengambil riwayat data:', err);
//   }
// }

// // Fungsi Pemicu Update Otomatis
// function updateDashboard() {
//   fetchLatest();
//   fetchHistory();
// }

// // Inisialisasi Saat Halaman Dimuat
// document.addEventListener('DOMContentLoaded', () => {
//   initChart();
//   updateDashboard();

//   // Polling data otomatis setiap 5 detik (5000 ms)
//   setInterval(updateDashboard, 5000);
// });

const socket = io();
let sensorChart = null;

// Helper function untuk mengonversi UTC timestamp dari SQLite ke Waktu Lokal (WIB)
function formatLocalTime(utcString) {
  if (!utcString) return '--:--:--';
  // Tambahkan akhiran 'Z' jika string UTC dari SQLite belum memilikinya
  const isoUtc = utcString.endsWith('Z') ? utcString : utcString.replace(' ', 'T') + 'Z';
  const dateObj = new Date(isoUtc);

  return dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Inisialisasi Chart.js
function initChart() {
  const ctx = document.getElementById('sensorChart').getContext('2d');
  sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Suhu (°C)',
          data: [],
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Kelembapan (%)',
          data: [],
          borderColor: '#17a2b8',
          backgroundColor: 'rgba(23, 162, 184, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { display: true, title: { display: true, text: 'Waktu (WIB)' } },
        y: { beginAtZero: false }
      }
    }
  });
}

// Memuat riwayat data awal (20 data terakhir)
async function loadInitialData() {
  try {
    const res = await fetch('/api/readings?limit=20');
    if (!res.ok) return;
    const data = await res.json();
    
    // Urutkan data dari yang lama ke baru untuk grafik
    const sortedData = [...data].reverse();

    // Konversi jam ke WIB untuk label grafik
    sensorChart.data.labels = sortedData.map(item => formatLocalTime(item.created_at));
    sensorChart.data.datasets[0].data = sortedData.map(item => item.suhu);
    sensorChart.data.datasets[1].data = sortedData.map(item => item.kelembapan);
    sensorChart.update();

    // Update UI kartu & tabel menggunakan data terbaru (index 0)
    if (data.length > 0) {
      updateUI(data[0]);
      updateTable(data.slice(0, 10)); // 10 data terbaru
    }
  } catch (err) {
    console.error('Gagal memuat data awal:', err);
  }
}

// Update nilai pada Kartu Status Indikator
function updateUI(data) {
  document.getElementById('val-suhu').textContent = data.suhu;
  document.getElementById('val-kelembapan').textContent = data.kelembapan;

  // Format jam ke WIB
  const wibTime = formatLocalTime(data.created_at);
  document.getElementById('time-suhu').textContent = wibTime;
  document.getElementById('time-kelembapan').textContent = wibTime;

  // Ubah warna kartu jika suhu > 35°C
  const suhuCard = document.getElementById('suhu-card');
  suhuCard.className = data.suhu > 35 ? 'card card-hot' : 'card card-normal';

  // Indikator Status Online (jika data < 30 detik)
  const isoUtc = data.created_at.endsWith('Z') ? data.created_at : data.created_at.replace(' ', 'T') + 'Z';
  const lastDataTime = new Date(isoUtc).getTime();
  const diffSeconds = (new Date().getTime() - lastDataTime) / 1000;

  const statusBadge = document.getElementById('device-status');
  if (diffSeconds < 30) {
    statusBadge.textContent = 'Online';
    statusBadge.className = 'status-badge online';
  } else {
    statusBadge.textContent = 'Offline';
    statusBadge.className = 'status-badge offline';
  }
}

// Update Tabel 10 Data Terakhir
function updateTable(dataList) {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  tbody.innerHTML = dataList.map(item => `
    <tr>
      <td>${item.device_id || 'GH-ESP8266'}</td>
      <td>${item.suhu} °C</td>
      <td>${item.kelembapan} %</td>
      <td>${formatLocalTime(item.created_at)} WIB</td>
    </tr>
  `).join('');
}

// LISTEN WEBSOCKET: Terima data real-time bertubi-tubi
socket.on('new_reading', (data) => {
  // Update Kartu Nilai
  updateUI(data);

  // Tambah data baru ke grafik dengan format jam WIB
  const timeLabel = formatLocalTime(data.created_at);
  sensorChart.data.labels.push(timeLabel);
  sensorChart.data.datasets[0].data.push(data.suhu);
  sensorChart.data.datasets[1].data.push(data.kelembapan);

  // Jaga grafik maksimal 20 data agar tidak berat
  if (sensorChart.data.labels.length > 20) {
    sensorChart.data.labels.shift();
    sensorChart.data.datasets[0].data.shift();
    sensorChart.data.datasets[1].data.shift();
  }
  sensorChart.update();

  // Minta riwayat data terbaru untuk memperbarui tabel
  fetch('/api/readings?limit=10')
    .then(res => res.json())
    .then(latestData => updateTable(latestData))
    .catch(err => console.error(err));
});

document.addEventListener('DOMContentLoaded', () => {
  initChart();
  loadInitialData();
});