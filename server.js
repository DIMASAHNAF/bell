const express = require('express');
const initSqlJs = require('sql.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

let db;

// Initialize database
async function initDB() {
    const SQL = await initSqlJs();
    const dbPath = path.join(__dirname, 'database.db');
    
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }
    
    db.run(`
        CREATE TABLE IF NOT EXISTS jadwal (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hari TEXT NOT NULL,
            waktu TEXT NOT NULL,
            nama_kegiatan TEXT NOT NULL,
            file_audio TEXT NOT NULL,
            kategori TEXT DEFAULT 'Pelajaran'
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS bell_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jadwal_id INTEGER,
            waktu_bunyi TEXT NOT NULL,
            nama_kegiatan TEXT NOT NULL,
            trigger_type TEXT DEFAULT 'auto',
            triggered_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            is_active INTEGER DEFAULT 0
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS skip_days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT NOT NULL UNIQUE,
            keterangan TEXT
        )
    `);
    
    const userCount = db.exec('SELECT COUNT(*) FROM users');
    if (!userCount.length || userCount[0].values[0][0] === 0) {
        db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'admin', 'admin')");
        db.run("INSERT INTO users (username, password, role) VALUES ('user', 'user', 'user')");
        saveDB();
    }
    
    const settingsCount = db.exec('SELECT COUNT(*) FROM settings');
    if (!settingsCount.length || settingsCount[0].values[0][0] === 0) {
        db.run("INSERT INTO settings (key, value) VALUES ('volume', '0.8')");
        db.run("INSERT INTO settings (key, value) VALUES ('active_profile', '0')");
        saveDB();
    }
    
    const result = db.exec('SELECT COUNT(*) as count FROM jadwal');
    const count = result.length > 0 ? result[0].values[0][0] : 0;
    
    if (count === 0) {
        const seed = [
            ['Senin', '07:00:00', 'Pembiasaan Baik', 'bell1.mp3'],
            ['Senin', '07:15:00', 'Upacara', 'bell2.mp3'],
            ['Senin', '10:45:00', 'Istirahat 1', 'bell3.mp3'],
            ['Senin', '12:22:00', 'Istirahat 2', 'bell4.mp3'],
            ['Senin', '16:00:00', 'Pulang', 'bell5.mp3']
        ];
        seed.forEach(row => {
            db.run('INSERT INTO jadwal (hari, waktu, nama_kegiatan, file_audio) VALUES (?, ?, ?, ?)', row);
        });
        saveDB();
        console.log('✓ Seed data inserted');
    }
}

function saveDB() {
    const data = db.export();
    fs.writeFileSync(path.join(__dirname, 'database.db'), Buffer.from(data));
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'suara');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/mpeg') {
            cb(null, true);
        } else {
            cb(new Error('Only .mp3 allowed'), false);
        }
    }
});

// API: Upload audio
app.post('/api/upload', upload.single('audio'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({ filename: req.file.filename });
});

// API: Delete audio
app.delete('/api/audio/:filename', (req, res) => {
    const filepath = path.join(__dirname, 'public', 'suara', req.params.filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const result = db.exec('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (result.length > 0 && result[0].values.length > 0) {
        const user = { id: result[0].values[0][0], username: result[0].values[0][1], role: result[0].values[0][3] };
        res.json({ success: true, user });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// API: List audio
app.get('/api/audio', (req, res) => {
    const dir = path.join(__dirname, 'public', 'suara');
    if (!fs.existsSync(dir)) return res.json([]);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3'));
    res.json(files);
});

// API: Get all jadwal
app.get('/api/jadwal/all', (req, res) => {
    const result = db.exec('SELECT * FROM jadwal ORDER BY hari, waktu');
    const jadwal = result.length > 0 ? result[0].values.map(row => ({
        id: row[0], hari: row[1], waktu: row[2],
        nama_kegiatan: row[3], file_audio: row[4], kategori: row[5]
    })) : [];
    res.json(jadwal);
});

// API: Get jadwal today
app.get('/api/jadwal', (req, res) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const today = days[new Date().getDay()];
    const result = db.exec('SELECT * FROM jadwal WHERE hari = ? ORDER BY waktu', [today]);
    const jadwal = result.length > 0 ? result[0].values.map(row => ({
        id: row[0], hari: row[1], waktu: row[2],
        nama_kegiatan: row[3], file_audio: row[4], kategori: row[5]
    })) : [];
    res.json({ hari: today, jadwal });
});

// API: Add jadwal
app.post('/api/jadwal', (req, res) => {
    const { hari, waktu, nama_kegiatan, file_audio, kategori } = req.body;
    db.run('INSERT INTO jadwal (hari, waktu, nama_kegiatan, file_audio, kategori) VALUES (?, ?, ?, ?, ?)', 
        [hari, waktu, nama_kegiatan, file_audio, kategori || 'Pelajaran']);
    saveDB();
    res.json({ success: true });
});

// API: Update jadwal
app.put('/api/jadwal/:id', (req, res) => {
    const { hari, waktu, nama_kegiatan, file_audio, kategori } = req.body;
    db.run('UPDATE jadwal SET hari = ?, waktu = ?, nama_kegiatan = ?, file_audio = ?, kategori = ? WHERE id = ?', 
        [hari, waktu, nama_kegiatan, file_audio, kategori || 'Pelajaran', req.params.id]);
    saveDB();
    res.json({ success: true });
});

// API: Delete jadwal
app.delete('/api/jadwal/:id', (req, res) => {
    db.run('DELETE FROM jadwal WHERE id = ?', [req.params.id]);
    saveDB();
    res.json({ success: true });
});

// API: Manual trigger bell
app.post('/api/bell/trigger/:id', (req, res) => {
    const { username } = req.body;
    const result = db.exec('SELECT * FROM jadwal WHERE id = ?', [req.params.id]);
    if (result.length > 0 && result[0].values.length > 0) {
        const row = result[0].values[0];
        db.run('INSERT INTO bell_logs (jadwal_id, waktu_bunyi, nama_kegiatan, trigger_type, triggered_by) VALUES (?, ?, ?, ?, ?)',
            [row[0], new Date().toISOString(), row[3], 'manual', username]);
        saveDB();
        res.json({ success: true, file_audio: row[4] });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// API: Get bell logs
app.get('/api/logs', (req, res) => {
    const result = db.exec('SELECT * FROM bell_logs ORDER BY created_at DESC LIMIT 100');
    const logs = result.length > 0 ? result[0].values.map(row => ({
        id: row[0], jadwal_id: row[1], waktu_bunyi: row[2], nama_kegiatan: row[3],
        trigger_type: row[4], triggered_by: row[5], created_at: row[6]
    })) : [];
    res.json(logs);
});

// API: Export logs to CSV
app.get('/api/logs/export', (req, res) => {
    const result = db.exec('SELECT * FROM bell_logs ORDER BY created_at DESC');
    const logs = result.length > 0 ? result[0].values : [];
    let csv = 'ID,Jadwal ID,Waktu Bunyi,Kegiatan,Tipe,Triggered By,Created At\n';
    logs.forEach(row => {
        csv += `${row[0]},${row[1]},"${row[2]}","${row[3]}",${row[4]},${row[5] || ''},"${row[6]}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bell_logs.csv');
    res.send(csv);
});

// API: Get settings
app.get('/api/settings', (req, res) => {
    const result = db.exec('SELECT * FROM settings');
    const settings = {};
    if (result.length > 0) {
        result[0].values.forEach(row => {
            settings[row[0]] = row[1];
        });
    }
    res.json(settings);
});

// API: Update setting
app.put('/api/settings/:key', (req, res) => {
    const { value } = req.body;
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [req.params.key, value]);
    saveDB();
    res.json({ success: true });
});

// API: Get profiles
app.get('/api/profiles', (req, res) => {
    const result = db.exec('SELECT * FROM profiles');
    const profiles = result.length > 0 ? result[0].values.map(row => ({
        id: row[0], name: row[1], is_active: row[2]
    })) : [];
    res.json(profiles);
});

// API: Add profile
app.post('/api/profiles', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO profiles (name) VALUES (?)', [name]);
    saveDB();
    res.json({ success: true });
});

// API: Activate profile
app.put('/api/profiles/:id/activate', (req, res) => {
    db.run('UPDATE profiles SET is_active = 0');
    db.run('UPDATE profiles SET is_active = 1 WHERE id = ?', [req.params.id]);
    db.run('UPDATE settings SET value = ? WHERE key = ?', [req.params.id, 'active_profile']);
    saveDB();
    res.json({ success: true });
});

// API: Delete profile
app.delete('/api/profiles/:id', (req, res) => {
    db.run('DELETE FROM profiles WHERE id = ?', [req.params.id]);
    saveDB();
    res.json({ success: true });
});

// API: Get skip days
app.get('/api/skipdays', (req, res) => {
    const result = db.exec('SELECT * FROM skip_days ORDER BY tanggal');
    const days = result.length > 0 ? result[0].values.map(row => ({
        id: row[0], tanggal: row[1], keterangan: row[2]
    })) : [];
    res.json(days);
});

// API: Add skip day
app.post('/api/skipdays', (req, res) => {
    const { tanggal, keterangan } = req.body;
    db.run('INSERT INTO skip_days (tanggal, keterangan) VALUES (?, ?)', [tanggal, keterangan]);
    saveDB();
    res.json({ success: true });
});

// API: Delete skip day
app.delete('/api/skipdays/:id', (req, res) => {
    db.run('DELETE FROM skip_days WHERE id = ?', [req.params.id]);
    saveDB();
    res.json({ success: true });
});

// API: Export jadwal
app.get('/api/jadwal/export', (req, res) => {
    const result = db.exec('SELECT * FROM jadwal ORDER BY hari, waktu');
    const jadwal = result.length > 0 ? result[0].values.map(row => ({
        hari: row[1], waktu: row[2], nama_kegiatan: row[3], file_audio: row[4], kategori: row[5]
    })) : [];
    res.json(jadwal);
});

// API: Import jadwal
app.post('/api/jadwal/import', (req, res) => {
    const { jadwal } = req.body;
    jadwal.forEach(item => {
        db.run('INSERT INTO jadwal (hari, waktu, nama_kegiatan, file_audio, kategori) VALUES (?, ?, ?, ?, ?)',
            [item.hari, item.waktu, item.nama_kegiatan, item.file_audio, item.kategori || 'Pelajaran']);
    });
    saveDB();
    res.json({ success: true, count: jadwal.length });
});

// Start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🔔 Bell System → http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Init failed:', err);
    process.exit(1);
});
