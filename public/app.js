
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
let kategoriList = [];
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
    const filtered = jadwal.filter(j => {
        if (j.hari !== todayName) return false;
        if (todayName === 'Senin') {
            if (j.mode === 'upacara' && currentModeSenin !== 'upacara') return false;
            if (j.mode === 'hujan' && currentModeSenin !== 'hujan') return false;
        }
        return true;
    });
    filtered.sort((a, b) => a.waktu.localeCompare(b.waktu));
    
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
        const target = document.getElementById('page-' + page);
        if (target) target.classList.add('active');
        
        if (page === 'sounds') loadSounds();
        if (page === 'jadwal') {
            loadKategori();
            renderTable();
        }
        if (page === 'kategori') loadKategori();
    });
});

function navigateToPage(pageName) {
    const link = document.querySelector(`.nav-link[data-page="${pageName}"]`);
    if (link) link.click();
}

const shortcutBtn = document.getElementById('btnKelolaKategoriShortcut');
if (shortcutBtn) {
    shortcutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToPage('kategori');
    });
}

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
    const files = document.getElementById('audioFile').files;
    if (files.length === 0) return;
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Uploading...';
    btn.disabled = true;

    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('audio', files[i]);
        await fetch('/api/upload', { method: 'POST', body: formData });
    }
    
    document.getElementById('audioFile').value = '';
    btn.textContent = originalText;
    btn.disabled = false;
    
    loadSounds();
    loadJadwal();
});

// Delete sound
async function deleteSound(filename) {
    if (!confirm('Hapus ' + filename + '?')) return;
    await fetch('/api/audio/' + encodeURIComponent(filename), { method: 'DELETE' });
    loadSounds();
}

// ==========================================
// MODE HARI SENIN (UPACARA vs HUJAN/MENDUNG)
// ==========================================
let currentModeSenin = 'upacara';

async function loadModeSenin() {
    try {
        const res = await fetch('/api/mode-senin');
        const data = await res.json();
        currentModeSenin = data.mode || 'upacara';
        updateModeSeninUI();
    } catch (e) {
        console.error('Error loadModeSenin:', e);
    }
}

async function toggleModeSenin() {
    const newMode = currentModeSenin === 'upacara' ? 'hujan' : 'upacara';
    try {
        const res = await fetch('/api/mode-senin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: newMode })
        });
        const data = await res.json();
        if (data.success) {
            currentModeSenin = data.mode;
            updateModeSeninUI();
            renderTable();
            updateStatusPage();
        }
    } catch (e) {
        alert('Gagal mengubah mode: ' + e.message);
    }
}

function updateModeSeninUI() {
    const isHujan = currentModeSenin === 'hujan';
    
    const icon = document.getElementById('modeSeninIcon');
    const title = document.getElementById('modeSeninTitle');
    const badge = document.getElementById('modeSeninBadge');
    const desc = document.getElementById('modeSeninDesc');
    const btnTexts = document.querySelectorAll('.btnToggleModeSeninText');
    const btnIcons = document.querySelectorAll('.btnToggleModeSeninIcon');
    const noticeIcon = document.getElementById('modeSeninNoticeIcon');
    const noticeText = document.getElementById('modeSeninNoticeText');

    if (icon) icon.textContent = isHujan ? '🌧️' : '☀️';
    if (title) title.textContent = isHujan ? 'Mode Hari Senin: Hujan / Tanpa Upacara' : 'Mode Hari Senin: Upacara Normal';
    if (badge) {
        badge.textContent = isHujan ? 'MODE HUJAN (UPACARA NONAKTIF)' : 'UPACARA AKTIF';
        badge.style.background = isHujan ? '#fee2e2' : '#dcfce7';
        badge.style.color = isHujan ? '#b91c1c' : '#15803d';
    }
    if (desc) {
        desc.textContent = isHujan 
            ? 'Bel baris 07:10 & Upacara 07:15 dinonaktifkan (skip). Bel Les 1 & Doa Pagi langsung di kelas.'
            : 'Bel persiapan upacara (07:10) & bel upacara (07:15) berbunyi normal.';
    }
    btnTexts.forEach(el => {
        el.textContent = isHujan ? 'Kembalikan ke Mode Upacara Normal ☀️' : 'Ganti ke Mode Hujan (Tanpa Upacara) 🌧️';
    });
    btnIcons.forEach(el => {
        el.textContent = isHujan ? '☀️' : '🌧️';
    });
    if (noticeIcon) noticeIcon.textContent = isHujan ? '🌧️' : '☀️';
    if (noticeText) {
        noticeText.textContent = isHujan 
            ? 'Hari Senin: Mode Hujan (Bel Baris & Upacara Dinonaktifkan)'
            : 'Hari Senin: Mode Upacara Normal (Bel Baris & Upacara Aktif)';
    }
}

document.addEventListener('click', (e) => {
    if (e.target.closest('.btnToggleModeSenin')) {
        toggleModeSenin();
    }
});

// Auto-apply rombal schedule once
let isSyncingRombal = false;
async function autoApplyRombalSchedule() {
    if (localStorage.getItem('rombal_v6_synced') === 'true' || isSyncingRombal) return;
    isSyncingRombal = true;
    try {
        console.log('Syncing rombal baru lengkap Senin-Jumat (v6)...');
        const resData = await fetch('/jadwal_rombal_baru.json');
        const newSchedule = await resData.json();
        
        const resAll = await fetch('/api/jadwal/all');
        const existing = await resAll.json();
        
        const targetDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        for (const item of existing) {
            if (targetDays.includes(item.hari)) {
                await fetch(`/api/jadwal/${item.id}`, { method: 'DELETE' });
            }
        }
        
        for (const item of newSchedule) {
            await fetch('/api/jadwal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
        }
        
        localStorage.setItem('rombal_v6_synced', 'true');
        console.log('✓ Rombal baru lengkap (v6) berhasil diterapkan');
        const resAfter = await fetch('/api/jadwal/all');
        jadwal = await resAfter.json();
        initDayTabs();
        renderTable();
        updateStatusPage();
    } catch (e) {
        console.error('Auto sync error:', e);
    } finally {
        isSyncingRombal = false;
    }
}

// Load jadwal
async function loadJadwal() {
    const res = await fetch('/api/jadwal/all');
    jadwal = await res.json();
    initDayTabs();
    renderTable();
    updateStatusPage();
    
    if (localStorage.getItem('rombal_v6_synced') !== 'true') {
        autoApplyRombalSchedule();
    }
}

function renderTable() {
    const tbody = document.getElementById('jadwalTable');
    let filtered = jadwal.filter(j => j.hari === selectedDay);
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;">Belum ada jadwal untuk ' + selectedDay + '</td></tr>';
        return;
    }
    
    // Sort all items chronologically first
    filtered.sort((a, b) => a.waktu.localeCompare(b.waktu));
    
    // Group contiguous items of the same category
    const groupedArray = [];
    let currentKat = null;
    let currentGroup = null;

    filtered.forEach(item => {
        const kat = item.kategori || 'Pelajaran';
        if (kat !== currentKat) {
            currentKat = kat;
            currentGroup = { kat: kat, items: [] };
            groupedArray.push(currentGroup);
        }
        currentGroup.items.push(item);
    });
    
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    
    let html = '';
    groupedArray.forEach(group => {
        html += `<tr style="background:#f0f0f0;"><td colspan="6" style="font-weight:600;padding:8px 12px;">${group.kat}</td></tr>`;
        group.items.forEach(item => {
            const isActive = isTimeActive(item.waktu);
            const itemTime = item.waktu.substring(0, 5);
            const hasPassed = itemTime < currentTime;
            
            let modeBadge = '';
            let isItemSkipped = false;
            if (item.hari === 'Senin') {
                if (item.mode === 'upacara') {
                    if (currentModeSenin !== 'upacara') {
                        isItemSkipped = true;
                        modeBadge = ' <span style="padding:2px 6px;background:#f1f5f9;color:#64748b;border-radius:10px;font-size:10px;font-weight:600;">(Dilewati / Mode Hujan)</span>';
                    } else {
                        modeBadge = ' <span style="padding:2px 6px;background:#dbeafe;color:#1e40af;border-radius:10px;font-size:10px;font-weight:600;">☀️ Upacara</span>';
                    }
                } else if (item.mode === 'hujan') {
                    if (currentModeSenin !== 'hujan') {
                        isItemSkipped = true;
                        modeBadge = ' <span style="padding:2px 6px;background:#f1f5f9;color:#64748b;border-radius:10px;font-size:10px;font-weight:600;">(Hanya Saat Hujan)</span>';
                    } else {
                        modeBadge = ' <span style="padding:2px 6px;background:#fee2e2;color:#b91c1c;border-radius:10px;font-size:10px;font-weight:600;">🌧️ Mode Hujan</span>';
                    }
                }
            }
            
            html += `
                <tr ${isActive ? 'style="background:#fffacd;font-weight:600;"' : (isItemSkipped ? 'style="opacity:0.55;background:#fafafa;"' : '')}>
                    <td>
                        ${item.waktu}
                        ${hasPassed ? '<span style="display:inline-block;margin-left:8px;padding:2px 8px;background:#9e9e9e;color:white;border-radius:12px;font-size:11px;font-weight:600;">Sudah Bunyi</span>' : ''}
                    </td>
                    <td>${item.nama_kegiatan}${modeBadge}</td>
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
    updateKategoriSelect(item.kategori || 'Pelajaran');
    document.getElementById('kategori').value = item.kategori || 'Pelajaran';
    document.getElementById('sound').value = item.file_audio;
    
    const btn = document.querySelector('#addForm button[type="submit"]');
    btn.textContent = 'Update';
    btn.dataset.editId = id;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// KATEGORI MANAGEMENT
// ==========================================

async function loadKategori() {
    try {
        const res = await fetch('/api/kategori');
        kategoriList = await res.json();
    } catch (err) {
        console.error('Failed to load kategori:', err);
    }
    updateKategoriSelect();
    renderKategoriTable();
}

function updateKategoriSelect(selectedValue = null) {
    const sel = document.getElementById('kategori');
    if (!sel) return;
    
    if (kategoriList.length === 0) {
        sel.innerHTML = '<option value="Pelajaran">Pelajaran</option>';
        return;
    }
    
    sel.innerHTML = '<option value="">Pilih Kategori...</option>' + kategoriList.map(k => 
        `<option value="${k.nama}" ${selectedValue === k.nama ? 'selected' : (k.nama === 'Pelajaran' && !selectedValue ? 'selected' : '')}>${k.nama}</option>`
    ).join('');
}

function renderKategoriTable() {
    const tbody = document.getElementById('kategoriTable');
    if (!tbody) return;
    
    if (kategoriList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">Belum ada data kategori</td></tr>';
        return;
    }
    
    tbody.innerHTML = kategoriList.map((k, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td style="font-weight:600;font-size:15px;">
                <span style="display:inline-block;padding:4px 12px;background:#e0f2fe;color:#0369a1;border-radius:16px;font-size:13px;font-weight:600;">
                    ${k.nama}
                </span>
            </td>
            <td>
                <span style="display:inline-block;padding:4px 10px;background:${k.total_jadwal > 0 ? '#ecfdf5' : '#f3f4f6'};color:${k.total_jadwal > 0 ? '#047857' : '#6b7280'};border-radius:12px;font-size:12px;font-weight:600;">
                    ${k.total_jadwal} Jadwal
                </span>
            </td>
            <td class="actions">
                <button class="secondary" onclick="editKategori(${k.id}, '${k.nama.replace(/'/g, "\\'")}')" style="padding:6px 12px;margin-right:6px;">Edit</button>
                <button class="danger" onclick="deleteKategori(${k.id}, '${k.nama.replace(/'/g, "\\'")}', ${k.total_jadwal})" style="padding:6px 12px;">Hapus</button>
            </td>
        </tr>
    `).join('');
}

// Submit Form Tambah / Edit Kategori
const kategoriForm = document.getElementById('kategoriForm');
if (kategoriForm) {
    kategoriForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const namaInput = document.getElementById('kategoriNama');
        const editIdInput = document.getElementById('kategoriEditId');
        const nama = namaInput.value.trim();
        const editId = editIdInput.value;
        
        if (!nama) return;
        
        const submitBtn = document.getElementById('kategoriSubmitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Menyimpan...';
        submitBtn.disabled = true;
        
        try {
            let res;
            if (editId) {
                res = await fetch('/api/kategori/' + editId, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nama })
                });
            } else {
                res = await fetch('/api/kategori', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nama })
                });
            }
            
            const data = await res.json();
            if (data.error) {
                alert(data.error);
                return;
            }
            
            resetKategoriForm();
            await loadKategori();
            await loadJadwal();
        } catch (err) {
            alert('Gagal menyimpan kategori: ' + err.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

function editKategori(id, currentName) {
    document.getElementById('kategoriFormTitle').textContent = 'Edit Kategori: ' + currentName;
    document.getElementById('kategoriNama').value = currentName;
    document.getElementById('kategoriEditId').value = id;
    document.getElementById('kategoriSubmitBtn').textContent = 'Update Kategori';
    document.getElementById('kategoriCancelBtn').style.display = 'inline-block';
    document.getElementById('kategoriNama').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetKategoriForm() {
    document.getElementById('kategoriFormTitle').textContent = 'Tambah Kategori Baru';
    document.getElementById('kategoriNama').value = '';
    document.getElementById('kategoriEditId').value = '';
    document.getElementById('kategoriSubmitBtn').textContent = 'Tambah Kategori';
    document.getElementById('kategoriCancelBtn').style.display = 'none';
}

const cancelBtn = document.getElementById('kategoriCancelBtn');
if (cancelBtn) {
    cancelBtn.addEventListener('click', resetKategoriForm);
}

async function deleteKategori(id, nama, totalJadwal) {
    let msg = `Yakin ingin menghapus kategori "${nama}"?`;
    if (totalJadwal > 0) {
        msg = `⚠️ PERINGATAN:\nKategori "${nama}" saat ini sedang digunakan oleh ${totalJadwal} jadwal.\n\nJika kategori ini dihapus, ${totalJadwal} jadwal tersebut akan dialihkan otomatis ke kategori "Pelajaran".\n\nApakah Anda yakin ingin melanjutkan hapus?`;
    }
    
    if (!confirm(msg)) return;
    
    try {
        const res = await fetch('/api/kategori/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        await loadKategori();
        await loadJadwal();
    } catch (err) {
        alert('Gagal menghapus kategori: ' + err.message);
    }
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

let currentPreviewAudio = null;

// Preview sound
document.getElementById('previewSound')?.addEventListener('click', (e) => {
    const btn = e.target;
    
    if (currentPreviewAudio) {
        currentPreviewAudio.pause();
        currentPreviewAudio.currentTime = 0;
        currentPreviewAudio = null;
        btn.textContent = 'Preview';
        btn.style.background = '#2196f3';
        return;
    }
    
    const filename = document.getElementById('sound').value;
    if (!filename) return alert('Pilih sound dulu');
    
    currentPreviewAudio = new Audio('/suara/' + filename);
    const volume = parseFloat(localStorage.getItem('bellVolume') || '0.8');
    currentPreviewAudio.volume = volume;
    
    btn.textContent = 'Stop Preview';
    btn.style.background = '#f44336';
    
    currentPreviewAudio.addEventListener('ended', () => {
        currentPreviewAudio = null;
        btn.textContent = 'Preview';
        btn.style.background = '#2196f3';
    });
    
    currentPreviewAudio.play();
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
    const filtered = jadwal.filter(j => j.hari === selectedDay);
    if (filtered.length === 0) return alert(`Tidak ada jadwal di hari ${selectedDay} untuk di-export`);
    
    const exportData = filtered.map(item => ({
        waktu: item.waktu,
        nama_kegiatan: item.nama_kegiatan,
        file_audio: item.file_audio,
        kategori: item.kategori || 'Pelajaran'
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal_${selectedDay}_${new Date().toISOString().split('T')[0]}.json`;
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
    let importData = JSON.parse(text);
    
    if (!confirm(`Import ${importData.length} jadwal ke hari ${selectedDay}?`)) return;
    
    importData = importData.map(item => ({
        ...item,
        hari: selectedDay
    }));
    
    const res = await fetch('/api/jadwal/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jadwal: importData })
    });
    
    const result = await res.json();
    alert(`Berhasil import ${result.count} jadwal ke hari ${selectedDay}`);
    e.target.value = '';
    loadJadwal();
});

// Terapkan Jadwal Rombal Baru (Foto)
document.getElementById('btnTerapkanJadwalBaru')?.addEventListener('click', async () => {
    if (!confirm('Terapkan jadwal baru Senin - Jumat sesuai foto rombal? (Jadwal lama Senin-Jumat akan digantikan dengan jadwal baru ini)')) {
        return;
    }
    
    const btn = document.getElementById('btnTerapkanJadwalBaru');
    const oldText = btn.textContent;
    btn.textContent = 'Memproses...';
    btn.disabled = true;
    
    try {
        const resData = await fetch('/jadwal_rombal_baru.json');
        const newSchedule = await resData.json();
        
        // 1. Ambil jadwal yang ada
        const resAll = await fetch('/api/jadwal/all');
        const existing = await resAll.json();
        
        // 2. Hapus jadwal lama Senin-Jumat
        const targetDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        for (const item of existing) {
            if (targetDays.includes(item.hari)) {
                await fetch(`/api/jadwal/${item.id}`, { method: 'DELETE' });
            }
        }
        
        // 3. Masukkan jadwal baru
        for (const item of newSchedule) {
            await fetch('/api/jadwal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
        }
        
        alert(`Berhasil! ${newSchedule.length} jadwal baru (Senin s.d. Jumat) telah diterapkan ke sistem.`);
        loadJadwal();
    } catch (err) {
        alert('Gagal menerapkan jadwal: ' + err.message);
    } finally {
        btn.textContent = oldText;
        btn.disabled = false;
    }
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
        
        // Skip jika hari Senin dan mode tidak cocok
        if (item.hari === 'Senin') {
            if (item.mode === 'upacara' && currentModeSenin !== 'upacara') return;
            if (item.mode === 'hujan' && currentModeSenin !== 'hujan') return;
        }

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
loadKategori();
loadModeSenin();
loadJadwal();
setInterval(checkAutoPlayWithSkip, 5000);
setInterval(checkMidnight, 60000);
setInterval(updateNextBell, 10000);
setInterval(updateStatusPage, 10000);

if (user.role === 'admin') {
    loadKategori();
    loadHistory();
    loadSkipDays();
    setInterval(loadHistory, 30000);
}
