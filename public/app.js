function parseWaktu(str) {
  return new Date(str.replace(' ', 'T') + 'Z');
}

function formatJam(str) {
  return parseWaktu(str).toLocaleTimeString('id-ID', { hour12: false, timeZone: 'Asia/Jakarta' });
}

function formatTanggalJam(str) {
  return parseWaktu(str).toLocaleString('id-ID', { hour12: false, timeZone: 'Asia/Jakarta' });
}

let sensorChart = null;


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
        x: { display: true, title: { display: true, text: 'Waktu' } },
        y: { beginAtZero: false }
      }
    }
  });
}


async function fetchLatest() {
  try {
    const res = await fetch('/api/readings/latest');
    if (!res.ok) return;
    const data = await res.json();

    const suhuEl = document.getElementById('val-suhu');
    const kelembapanEl = document.getElementById('val-kelembapan');
    const timeSuhuEl = document.getElementById('time-suhu');
    const timeKelembapanEl = document.getElementById('time-kelembapan');
    const suhuCard = document.getElementById('suhu-card');
    const statusBadge = document.getElementById('device-status');

    suhuEl.textContent = data.suhu;
    kelembapanEl.textContent = data.kelembapan;
    
    const formattedTime = formatJam(data.created_at);
    timeSuhuEl.textContent = formattedTime;
    timeKelembapanEl.textContent = formattedTime;


    if (data.suhu > 35) {
      suhuCard.className = 'card card-hot';
    } else {
      suhuCard.className = 'card card-normal';
    }

    const lastDataTime = parseWaktu(data.created_at).getTime();
    const now = new Date().getTime();
    const diffSeconds = (now - lastDataTime) / 1000;

    if (diffSeconds < 30) {
      statusBadge.textContent = 'Online';
      statusBadge.className = 'status-badge online';
    } else {
      statusBadge.textContent = 'Offline';
      statusBadge.className = 'status-badge offline';
    }
  } catch (err) {
    console.error('Gagal mengambil data terbaru:', err);
  }
}


async function fetchHistory() {
  try {
    const res = await fetch('/api/readings?limit=20');
    if (!res.ok) return;
    const data = await res.json();

    
    const sortedData = [...data].reverse();

    
    const labels = sortedData.map(item => formatJam(item.created_at));
    const suhuData = sortedData.map(item => item.suhu);
    const kelembapanData = sortedData.map(item => item.kelembapan);

    sensorChart.data.labels = labels;
    sensorChart.data.datasets[0].data = suhuData;
    sensorChart.data.datasets[1].data = kelembapanData;
    sensorChart.update();

    
    const tbody = document.getElementById('table-body');
    const latest10 = data.slice(0, 10);

    tbody.innerHTML = latest10.map(item => `
      <tr>
        <td>${item.device_id || 'GH-01'}</td>
        <td>${item.suhu}</td>
        <td>${item.kelembapan}</td>
        <td>${formatTanggalJam(item.created_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Gagal mengambil riwayat data:', err);
  }
}


function updateDashboard() {
  fetchLatest();
  fetchHistory();
}


document.addEventListener('DOMContentLoaded', () => {
  initChart();
  updateDashboard();
  
  
  setInterval(updateDashboard, 5000);
});