const http = require('http');

function autoKategori(nama) {
  const lower = nama.toLowerCase();
  if (lower.includes('pembiasaan') || lower.includes('upacara')) return 'Upacara';
  if (lower.includes('istirahat')) return 'Istirahat';
  if (lower.includes('pulang')) return 'Pulang';
  if (lower.includes('administrasi')) return 'Administrasi';
  if (lower.includes('olahraga') || lower.includes('print design') || lower.includes('gim') || lower.includes('tela-grafis')) return 'Ekstrakurikuler';
  return 'Pelajaran';
}

const schedule = [
  { hari: 'Senin', waktu: '07:00', nama_kegiatan: 'Pembiasaan Baik Sekolah', file_audio: 'bell1.mp3' },
  { hari: 'Senin', waktu: '07:15', nama_kegiatan: 'Upacara', file_audio: 'bell2.mp3' },
  { hari: 'Senin', waktu: '08:00', nama_kegiatan: 'IPA', file_audio: 'bell3.mp3' },
  { hari: 'Senin', waktu: '08:45', nama_kegiatan: 'Matematika', file_audio: 'bell4.mp3' },
  { hari: 'Senin', waktu: '09:23', nama_kegiatan: 'Bahasa Indonesia', file_audio: 'bell5.mp3' },
  { hari: 'Senin', waktu: '10:04', nama_kegiatan: 'Bahasa Inggris', file_audio: 'bell1.mp3' },
  { hari: 'Senin', waktu: '10:45', nama_kegiatan: 'Agama', file_audio: 'bell2.mp3' },
  { hari: 'Senin', waktu: '11:26', nama_kegiatan: 'Istirahat 1', file_audio: 'bell3.mp3' },
  { hari: 'Senin', waktu: '12:12', nama_kegiatan: 'Istirahat 2', file_audio: 'bell4.mp3' },
  { hari: 'Senin', waktu: '13:53', nama_kegiatan: 'Administrasi', file_audio: 'bell5.mp3' },
  { hari: 'Senin', waktu: '14:34', nama_kegiatan: 'Olahraga', file_audio: 'bell1.mp3' },
  { hari: 'Senin', waktu: '15:15', nama_kegiatan: 'Print Design', file_audio: 'bell2.mp3' },
  { hari: 'Senin', waktu: '16:00', nama_kegiatan: 'Pulang', file_audio: 'bell5.mp3' },
  { hari: 'Selasa', waktu: '07:00', nama_kegiatan: 'Pembiasaan Baik Sekolah', file_audio: 'bell1.mp3' },
  { hari: 'Selasa', waktu: '07:15', nama_kegiatan: 'Upacara', file_audio: 'bell2.mp3' },
  { hari: 'Selasa', waktu: '08:00', nama_kegiatan: 'Matematika', file_audio: 'bell3.mp3' },
  { hari: 'Selasa', waktu: '08:45', nama_kegiatan: 'Bahasa Indonesia', file_audio: 'bell4.mp3' },
  { hari: 'Selasa', waktu: '09:23', nama_kegiatan: 'IPA', file_audio: 'bell5.mp3' },
  { hari: 'Selasa', waktu: '10:04', nama_kegiatan: 'Keterampilan', file_audio: 'bell1.mp3' },
  { hari: 'Selasa', waktu: '10:45', nama_kegiatan: 'Agama', file_audio: 'bell2.mp3' },
  { hari: 'Selasa', waktu: '11:26', nama_kegiatan: 'Istirahat 1', file_audio: 'bell3.mp3' },
  { hari: 'Selasa', waktu: '12:12', nama_kegiatan: 'Istirahat 2', file_audio: 'bell4.mp3' },
  { hari: 'Selasa', waktu: '13:53', nama_kegiatan: 'Bahasa Inggris', file_audio: 'bell5.mp3' },
  { hari: 'Selasa', waktu: '14:34', nama_kegiatan: 'Tela-Grafis/Multimedia', file_audio: 'bell1.mp3' },
  { hari: 'Selasa', waktu: '15:15', nama_kegiatan: 'GIM', file_audio: 'bell2.mp3' },
  { hari: 'Selasa', waktu: '16:00', nama_kegiatan: 'Pulang', file_audio: 'bell5.mp3' },
  { hari: 'Rabu', waktu: '07:00', nama_kegiatan: 'Pembiasaan Baik Sekolah', file_audio: 'bell1.mp3' },
  { hari: 'Rabu', waktu: '07:15', nama_kegiatan: 'Upacara', file_audio: 'bell2.mp3' },
  { hari: 'Rabu', waktu: '08:00', nama_kegiatan: 'Bahasa Inggris', file_audio: 'bell3.mp3' },
  { hari: 'Rabu', waktu: '08:45', nama_kegiatan: 'Bahasa Indonesia', file_audio: 'bell4.mp3' },
  { hari: 'Rabu', waktu: '09:23', nama_kegiatan: 'Matematika', file_audio: 'bell5.mp3' },
  { hari: 'Rabu', waktu: '10:04', nama_kegiatan: 'IPA', file_audio: 'bell1.mp3' },
  { hari: 'Rabu', waktu: '10:45', nama_kegiatan: 'Keterampilan', file_audio: 'bell2.mp3' },
  { hari: 'Rabu', waktu: '11:26', nama_kegiatan: 'Istirahat 1', file_audio: 'bell3.mp3' },
  { hari: 'Rabu', waktu: '12:12', nama_kegiatan: 'Istirahat 2', file_audio: 'bell4.mp3' },
  { hari: 'Rabu', waktu: '13:53', nama_kegiatan: 'Administrasi', file_audio: 'bell5.mp3' },
  { hari: 'Rabu', waktu: '14:34', nama_kegiatan: 'Pancasila', file_audio: 'bell1.mp3' },
  { hari: 'Rabu', waktu: '15:15', nama_kegiatan: 'Bahasa Indonesia', file_audio: 'bell2.mp3' },
  { hari: 'Rabu', waktu: '16:00', nama_kegiatan: 'Pulang', file_audio: 'bell5.mp3' },
  { hari: 'Kamis', waktu: '07:00', nama_kegiatan: 'Pembiasaan Baik Sekolah', file_audio: 'bell1.mp3' },
  { hari: 'Kamis', waktu: '07:15', nama_kegiatan: 'Upacara', file_audio: 'bell2.mp3' },
  { hari: 'Kamis', waktu: '08:00', nama_kegiatan: 'IPA', file_audio: 'bell3.mp3' },
  { hari: 'Kamis', waktu: '08:45', nama_kegiatan: 'Tela-Grafis/Multimedia', file_audio: 'bell4.mp3' },
  { hari: 'Kamis', waktu: '09:23', nama_kegiatan: 'Agama', file_audio: 'bell5.mp3' },
  { hari: 'Kamis', waktu: '10:04', nama_kegiatan: 'Administrasi', file_audio: 'bell1.mp3' },
  { hari: 'Kamis', waktu: '10:45', nama_kegiatan: 'Bahasa Indonesia', file_audio: 'bell2.mp3' },
  { hari: 'Kamis', waktu: '11:26', nama_kegiatan: 'Istirahat 1', file_audio: 'bell3.mp3' },
  { hari: 'Kamis', waktu: '12:12', nama_kegiatan: 'Istirahat 2', file_audio: 'bell4.mp3' },
  { hari: 'Kamis', waktu: '13:53', nama_kegiatan: 'Bahasa Inggris', file_audio: 'bell5.mp3' },
  { hari: 'Kamis', waktu: '14:34', nama_kegiatan: 'Keterampilan', file_audio: 'bell1.mp3' },
  { hari: 'Kamis', waktu: '15:15', nama_kegiatan: 'Pancasila', file_audio: 'bell2.mp3' },
  { hari: 'Kamis', waktu: '16:00', nama_kegiatan: 'Pulang', file_audio: 'bell5.mp3' },
  { hari: 'Jumat', waktu: '07:00', nama_kegiatan: 'Pembiasaan Baik Sekolah', file_audio: 'bell1.mp3' },
  { hari: 'Jumat', waktu: '07:15', nama_kegiatan: 'Upacara', file_audio: 'bell2.mp3' },
  { hari: 'Jumat', waktu: '08:00', nama_kegiatan: 'Bahasa Indonesia', file_audio: 'bell3.mp3' },
  { hari: 'Jumat', waktu: '08:45', nama_kegiatan: 'Pancasila', file_audio: 'bell4.mp3' },
  { hari: 'Jumat', waktu: '09:23', nama_kegiatan: 'Agama', file_audio: 'bell5.mp3' },
  { hari: 'Jumat', waktu: '10:04', nama_kegiatan: 'Administrasi', file_audio: 'bell1.mp3' },
  { hari: 'Jumat', waktu: '10:45', nama_kegiatan: 'Keterampilan', file_audio: 'bell2.mp3' },
  { hari: 'Jumat', waktu: '11:26', nama_kegiatan: 'Pulang Awal', file_audio: 'bell3.mp3' }
].map(item => ({ ...item, kategori: autoKategori(item.nama_kegiatan) }));

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opt = {
      hostname: 'localhost', port: 3000, path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(opt, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(b));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function del(path) {
  return new Promise((resolve, reject) => {
    const opt = { hostname: 'localhost', port: 3000, path, method: 'DELETE' };
    const req = http.request(opt, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(b));
    });
    req.on('error', reject);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

async function run() {
  const existing = await get('/api/jadwal/all');
  console.log(`Deleting ${existing.length} old entries...`);
  for (const item of existing) {
    await del(`/api/jadwal/${item.id}`);
  }
  console.log('✓ All old entries deleted');

  for (const item of schedule) {
    await post('/api/jadwal', item);
  }
  console.log(`✓ Done! ${schedule.length} entries with kategori`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
