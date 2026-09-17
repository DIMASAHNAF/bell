const http = require('http');

// Schedule data extracted from screenshots
const schedule = [
  // SENIN
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

  // SELASA
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

  // RABU
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
  { hari: 'Rabu', waktu: '15:15', nama_kegiatan: 'Bis-Indo', file_audio: 'bell2.mp3' },
  { hari: 'Rabu', waktu: '16:00', nama_kegiatan: 'Pulang', file_audio: 'bell5.mp3' },

  // KAMIS
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

  // JUMAT
  { hari: 'Jumat', waktu: '07:00', nama_kegiatan: 'Pembiasaan Baik Sekolah', file_audio: 'bell1.mp3' },
  { hari: 'Jumat', waktu: '07:15', nama_kegiatan: 'Upacara', file_audio: 'bell2.mp3' },
  { hari: 'Jumat', waktu: '08:00', nama_kegiatan: 'Bahasa Indonesia', file_audio: 'bell3.mp3' },
  { hari: 'Jumat', waktu: '08:45', nama_kegiatan: 'Pancasila', file_audio: 'bell4.mp3' },
  { hari: 'Jumat', waktu: '09:23', nama_kegiatan: 'Agama', file_audio: 'bell5.mp3' },
  { hari: 'Jumat', waktu: '10:04', nama_kegiatan: 'Administrasi', file_audio: 'bell1.mp3' },
  { hari: 'Jumat', waktu: '10:45', nama_kegiatan: 'Keterampilan', file_audio: 'bell2.mp3' },
  { hari: 'Jumat', waktu: '11:26', nama_kegiatan: 'Pulang Awal', file_audio: 'bell3.mp3' }
];

async function insertSchedule() {
  for (const item of schedule) {
    const data = JSON.stringify(item);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/jadwal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log(`✓ ${item.hari} ${item.waktu} - ${item.nama_kegiatan}`);
          resolve();
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });

    await new Promise(r => setTimeout(r, 100));
  }
  console.log(`\n✓ Total ${schedule.length} entries inserted`);
  process.exit(0);
}

insertSchedule().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
