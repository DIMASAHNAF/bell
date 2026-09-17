// Auth check
const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!user) {
    location.href = '/login.html';
}

// Role-based UI
if (user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    location.href = '/login.html';
});

let sounds = [];
let jadwal = [];
let selectedDay = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).charAt(0).toUpperCase() + 
                  new Date().toLocaleDateString('id-ID', { weekday: 'long' }).slice(1);
const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
if (!days.includes(selectedDay)) selectedDay = 'Senin';

// Clock
function updateClock() {
    const now = new Date();
    const time = now.toTimeString().substring(0, 8);
    const date = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl) clockEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
}

// Status page
function updateStatusPage() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    const todayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
    const filtered = jadwal.filter(j => j.hari === todayName);
    
    const next = filtered.find(j => j.waktu.substring(0, 5) > currentTime);
    const info = document.getElementById('nextBellInfo');
    if (info) {
        if (next) {
            info.innerHTML = `<div style="font-size:16px;color:#666;margin-bottom:8px;">Bell Berikutnya</div>
                <div style="font-size:32px;font-weight:700;color:#667eea;margin-bottom:4px;">${next.waktu}</div>
                <div style="font-size:18px;color:#333;">${next.nama_kegiatan}</div>`;
        } else {
            info.innerHTML = '<div style="color:#999;">Tidak ada bell lagi hari ini</div>';
        }
    }
    
    const tbody = document.getElementById('todaySchedule');
    if (tbody) {
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;">Tidak ada jadwal</td></tr>';
        } else {
            tbody.innerHTML = filtered.map(item => {
                const isActive = item.waktu.substring(0, 5) === currentTime;
                return `<tr ${isActive ? 'style="background:#fffacd;font-weight:600;"' : ''}>
                    <td>${item.waktu}</td>
                    <td>${item.nama_kegiatan}</td>
                    <td>${item.kategori || 'Pelajaran'}</td>
                </tr>`;
            }).join('');
        }
    }
}

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');
        
        if (page === 'sounds') loadSounds();
        if (page === 'jadwal') renderTable();
    });
});

// Day tabs
function initDayTabs() {
    const container = document.getElementById('dayTabs');
    if (!container) return;
    container.innerHTML = days.map(day => `
        <button class="day-tab ${day === selectedDay ? 'active' : ''}" data-day="${day}">${day}</button>
    `).join('');
    
    container.querySelectorAll('.day-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDay = btn.dataset.day;
            document.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTable();
        });
    });
}

// Load sounds
async function loadSounds() {
    const res = await fetch('/api/audio');
    sounds = await res.json();
    
    const sel = document.getElementById('sound');
    sel.innerHTML = '<option value="">Pilih...</option>' + 
        sounds.map(f => `<option value="${f}">${f}</option>`).join('');
    
    const tbody = document.getElementById('soundTable');
    if (sounds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">Belum ada sound</td></tr>';
        return;
    }
    
    tbody.innerHTML = sounds.map((f, i) => `
        <tr>
            <td>${i + 1}</td>
            <td style="font-family:monospace;font-size:0.9rem;">${f}</td>
            <td><audio controls src="/suara/${f}"></audio></td>
            <td class="actions">
                <button class="danger" onclick="deleteSound('${f}')">Hapus</button>
            </td>
        </tr>
    `).join('');
}

// Upload sound
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('audioFile').files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('audio', file);
    
    await fetch('/api/upload', { method: 'POST', body: formData });
    document.getElementById('audioFile').value = '';
    loadSounds();
    loadJadwal();
});

// Delete sound
async function deleteSound(filename) {
    if (!confirm('Hapus ' + filename + '?')) return;
    await fetch('/api/audio/' + encodeURIComponent(filename), { method: 'DELETE' });
    loadSounds();
}

// Load jadwal
async function loadJadwal() {
    const res = await fetch('/api/jadwal/all');
    jadwal = await res.json();
    initDayTabs();
    renderTable();
    updateStatusPage();
}

// Render table with filters
function renderTable() {
    const tbody = document.getElementById('jadwalTable');
    const filtered = jadwal.filter(j => j.hari === selectedDay);
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;">Belum ada jadwal untuk ' + selectedDay + '</td></tr>';
        return;
    }
    
    const grouped = {};
    const order = ['Upacara', 'Pelajaran', 'Istirahat', 'Ekstrakurikuler', 'Administrasi', 'Pulang'];
    
    filtered.forEach(item => {
        const kat = item.kategori || 'Pelajaran';
        if (!grouped[kat]) grouped[kat] = [];
        grouped[kat].push(item);
    });
    
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    
    let html = '';
    order.forEach(kat => {
        if (!grouped[kat]) return;
        html += `<tr style="background:#f0f0f0;"><td colspan="6" style="font-weight:600;padding:8px 12px;">${kat}</td></tr>`;
        grouped[kat].forEach(item => {
            const isActive = isTimeActive(item.waktu);
            const itemTime = item.waktu.substring(0, 5);
            const hasPassed = itemTime < currentTime;
            
            html += `
                <tr ${isActive ? 'style="background:#fffacd;font-weight:600;"' : ''}>
                    <td>
                        ${item.waktu}
                        ${hasPassed ? '<span style="display:inline-block;margin-left:8px;padding:2px 8px;background:#9e9e9e;color:white;border-radius:12px;font-size:11px;font-weight:600;">Sudah Bunyi</span>' : ''}
                    </td>
                    <td>${item.nama_kegiatan}</td>
                    <td>
                        <audio controls src="/suara/${item.file_audio}" style="height:40px;width:250px;" ${hasPassed ? 'title="Bell sudah berbunyi"' : ''}></audio>
                    </td>
                    <td>
                        <button class="secondary" onclick="manualTrigger(${item.id}, '${item.file_audio}')" style="padding:8px 12px;">▶ Bunyikan</button>
                    </td>
                    <td class="actions">
                        <button class="secondary" onclick="editJadwal(${item.id})">Edit</button>
                        <button class="danger" onclick="deleteJadwal(${item.id})">Hapus</button>
                    </td>
                </tr>
            `;
        });
    });
    
    tbody.innerHTML = html;
    updateNextBell();
}

function isTimeActive(time) {
    const now = new Date();
    const current = now.toTimeString().substring(0, 5);
    return time.substring(0, 5) === current;
}

function updateNextBell() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    const filtered = jadwal.filter(j => j.hari === selectedDay);
    
    const next = filtered.find(j => j.waktu.substring(0, 5) > currentTime);
    const indicator = document.getElementById('nextBellIndicator');
    
    if (indicator && next) {
        indicator.innerHTML = `⏭️ Next: ${next.waktu} - ${next.nama_kegiatan}`;
    }
}

// Add/Update jadwal
document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const editId = btn.dataset.editId;
    
    const hari = document.getElementById('hari').value;
    const waktu = document.getElementById('waktu').value + ':00';
    const nama = document.getElementById('nama').value;
    const kategori = document.getElementById('kategori').value;
    const sound = document.getElementById('sound').value;
    
    if (editId) {
        // Update
        await fetch('/api/jadwal/' + editId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                hari, waktu, nama_kegiatan: nama, kategori, file_audio: sound 
            })
        });
        delete btn.dataset.editId;
        btn.textContent = 'Tambah';
    } else {
        // Insert
        await fetch('/api/jadwal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                hari, waktu, nama_kegiatan: nama, kategori, file_audio: sound 
            })
        });
    }
    
    document.getElementById('addForm').reset();
    await loadJadwal();
    selectedDay = hari;
    initDayTabs();
    renderTable();
});

// Delete jadwal
async function deleteJadwal(id) {
    if (!confirm('Hapus jadwal ini?')) return;
    await fetch('/api/jadwal/' + id, { method: 'DELETE' });
    loadJadwal();
}

// Edit jadwal
function editJadwal(id) {
    const item = jadwal.find(j => j.id === id);
    if (!item) return;
    
    document.getElementById('hari').value = item.hari;
    document.getElementById('waktu').value = item.waktu.substring(0, 5);
    document.getElementById('nama').value = item.nama_kegiatan;
    document.getElementById('kategori').value = item.kategori || 'Pelajaran';
    document.getElementById('sound').value = item.file_audio;
    
    const btn = document.querySelector('#addForm button[type="submit"]');
    btn.textContent = 'Update';
    btn.dataset.editId = id;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Auto-play logic
let played = new Set();

function checkAutoPlay() {
    const now = new Date();
    const day = now.getDay();
    
    if (day === 0 || day === 6) return;
    
    const currentTime = now.toTimeString().substring(0, 5);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[day];
    
    jadwal.forEach(item => {
        const itemTime = item.waktu.substring(0, 5);
        const key = item.id + '-' + currentTime;
        
        if (item.hari === todayName && itemTime === currentTime && !played.has(key)) {
            const audio = new Audio('/suara/' + item.file_audio);
            audio.play().catch(() => {});
            played.add(key);
            
            // Notification
            if (Notification.permission === 'granted') {
                new Notification('🔔 Bell', { body: item.nama_kegiatan });
            }
        }
    });
}

// Midnight reset
function checkMidnight() {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        played.clear();
    }
}

// Request notification permission
if (Notification.permission === 'default') {
    Notification.requestPermission();
}

// Manual trigger bell
async function manualTrigger(id, filename) {
    const audio = new Audio('/suara/' + filename);
    const volume = parseFloat(localStorage.getItem('bellVolume') || '0.8');
    audio.volume = volume;
    audio.play();
    
    await fetch('/api/bell/trigger/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
    });
    
    if (user.role === 'admin') loadHistory();
}

// Preview sound
document.getElementById('previewSound')?.addEventListener('click', () => {
    const filename = document.getElementById('sound').value;
    if (!filename) return alert('Pilih sound dulu');
    const audio = new Audio('/suara/' + filename);
    const volume = parseFloat(localStorage.getItem('bellVolume') || '0.8');
    audio.volume = volume;
    audio.play();
});

// Load history
async function loadHistory() {
    const res = await fetch('/api/logs');
    const logs = await res.json();
    const tbody = document.getElementById('historyTable');
    if (!tbody) return;
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">Belum ada history</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => {
        const date = new Date(log.waktu_bunyi);
        const formatted = date.toLocaleString('id-ID');
        return `<tr>
            <td>${formatted}</td>
            <td>${log.nama_kegiatan}</td>
            <td><span style="padding:4px 8px;background:${log.trigger_type === 'manual' ? '#ff9800' : '#4caf50'};color:white;border-radius:4px;font-size:12px;">${log.trigger_type}</span></td>
            <td>${log.triggered_by || '-'}</td>
        </tr>`;
    }).join('');
}

// Export logs
document.getElementById('exportLogs')?.addEventListener('click', () => {
    window.location.href = '/api/logs/export';
});

// Volume control
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

if (volumeSlider) {
    const saved = localStorage.getItem('bellVolume') || '0.8';
    volumeSlider.value = saved;
    volumeValue.textContent = Math.round(saved * 100) + '%';
    
    volumeSlider.addEventListener('input', async (e) => {
        const val = e.target.value;
        volumeValue.textContent = Math.round(val * 100) + '%';
        localStorage.setItem('bellVolume', val);
        
        await fetch('/api/settings/volume', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: val })
        });
    });
}

document.getElementById('testVolume')?.addEventListener('click', () => {
    if (sounds.length === 0) return alert('Belum ada sound');
    const audio = new Audio('/suara/' + sounds[0]);
    audio.volume = parseFloat(volumeSlider.value);
    audio.play();
});

// Skip days
async function loadSkipDays() {
    const res = await fetch('/api/skipdays');
    const days = await res.json();
    const tbody = document.getElementById('skipDaysTable');
    if (!tbody) return;
    
    if (days.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;">Belum ada skip day</td></tr>';
        return;
    }
    
    tbody.innerHTML = days.map(day => `<tr>
        <td>${new Date(day.tanggal).toLocaleDateString('id-ID')}</td>
        <td>${day.keterangan}</td>
        <td class="actions"><button class="danger" onclick="deleteSkipDay(${day.id})">Hapus</button></td>
    </tr>`).join('');
}

document.getElementById('skipDayForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tanggal = document.getElementById('skipDate').value;
    const keterangan = document.getElementById('skipNote').value;
    
    await fetch('/api/skipdays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, keterangan })
    });
    
    e.target.reset();
    loadSkipDays();
});

async function deleteSkipDay(id) {
    if (!confirm('Hapus skip day?')) return;
    await fetch('/api/skipdays/' + id, { method: 'DELETE' });
    loadSkipDays();
}

// Export jadwal
document.getElementById('exportJadwal')?.addEventListener('click', async () => {
    const res = await fetch('/api/jadwal/export');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jadwal_backup_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
});

// Import jadwal
document.getElementById('importJadwal')?.addEventListener('click', () => {
    document.getElementById('importFile').click();
});

document.getElementById('importFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const text = await file.text();
    const jadwal = JSON.parse(text);
    
    if (!confirm(`Import ${jadwal.length} jadwal?`)) return;
    
    const res = await fetch('/api/jadwal/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jadwal })
    });
    
    const result = await res.json();
    alert(`Berhasil import ${result.count} jadwal`);
    e.target.value = '';
    loadJadwal();
});

// Update checkAutoPlay with skip days check
async function checkAutoPlayWithSkip() {
    const now = new Date();
    const day = now.getDay();
    
    if (day === 0 || day === 6) return;
    
    // Check skip days
    const today = now.toISOString().split('T')[0];
    const skipRes = await fetch('/api/skipdays');
    const skipDays = await skipRes.json();
    const isSkipped = skipDays.some(d => d.tanggal === today);
    
    if (isSkipped) return;
    
    const currentTime = now.toTimeString().substring(0, 5);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[day];
    
    const volume = parseFloat(localStorage.getItem('bellVolume') || '0.8');
    
    jadwal.forEach(async item => {
        const itemTime = item.waktu.substring(0, 5);
        const key = item.id + '-' + currentTime;
        
        if (item.hari === todayName && itemTime === currentTime && !played.has(key)) {
            const audio = new Audio('/suara/' + item.file_audio);
            audio.volume = volume;
            audio.play().catch(() => {});
            played.add(key);
            
            // Log
            await fetch('/api/bell/trigger/' + item.id, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'auto' })
            });
            
            // Notification
            if (Notification.permission === 'granted') {
                new Notification('🔔 Bell', { body: item.nama_kegiatan });
            }
        }
    });
}

// Init
updateClock();
setInterval(updateClock, 1000);
loadSounds();
loadJadwal();
setInterval(checkAutoPlayWithSkip, 5000);
setInterval(checkMidnight, 60000);
setInterval(updateNextBell, 10000);
setInterval(updateStatusPage, 10000);

if (user.role === 'admin') {
    loadHistory();
    loadSkipDays();
    setInterval(loadHistory, 30000);
}
