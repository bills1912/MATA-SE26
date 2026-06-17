require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Wilayah, Laporan } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════
// HELPER — apakah tanggal = hari ini (WIB)?
// ═══════════════════════════════════════════
function isToday(dateValue) {
  const toDateStr = (d) => {
    const dt = new Date(d);
    const wib = new Date(dt.getTime() + 7 * 60 * 60 * 1000);
    return wib.toISOString().slice(0, 10);
  };
  return toDateStr(dateValue) === toDateStr(new Date());
}

// ═══════════════════════════════════════════
// WILAYAH
// ═══════════════════════════════════════════

app.get('/api/wilayah/kecamatan', async (req, res) => {
  try { res.json((await Wilayah.distinct('nmkec')).sort()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/wilayah/desa', async (req, res) => {
  try { res.json((await Wilayah.distinct('nmdesa', { nmkec: req.query.kecamatan })).sort()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/wilayah/sls', async (req, res) => {
  try {
    const q = {};
    if (req.query.kecamatan) q.nmkec = req.query.kecamatan;
    if (req.query.desa) q.nmdesa = req.query.desa;
    res.json(await Wilayah.find(q, { idsubsls:1, nmsubsls:1, nmsls:1, pencacah:1, pengawas:1, _id:0 }).lean());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/wilayah/:idsubsls', async (req, res) => {
  try {
    const d = await Wilayah.findOne({ idsubsls: req.params.idsubsls }).lean();
    if (!d) return res.status(404).json({ error: 'Not found' });
    res.json(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// LAPORAN — CRUD
// ═══════════════════════════════════════════

// POST /api/laporan — boleh submit untuk tanggal mana pun (tidak hanya hari ini)
// Jika sudah ada data di tanggal+SLS yang sama, akan di-overwrite (upsert)
app.post('/api/laporan', async (req, res) => {
  try {
    const {
      tanggal, idsubsls, nmkec, nmdesa, nmsubsls, pencacah, pengawas,
      jumlah_keluarga_submit, jumlah_usaha_submit, jumlah_bku_submit,
      jumlah_bangunan_kosong, total_bangunan,
      jumlah_belum_submit, catatan_belum_submit,
      catatan
    } = req.body;

    if (!tanggal || !idsubsls) {
      return res.status(400).json({ error: 'tanggal dan idsubsls wajib diisi' });
    }

    // Tidak boleh submit untuk tanggal masa depan
    const tglInput = new Date(tanggal);
    const tglInputStr = new Date(tglInput.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const todayStr = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (tglInputStr > todayStr) {
      return res.status(403).json({
        error: 'Laporan tidak dapat dibuat untuk tanggal masa depan',
        code: 'DATE_IN_FUTURE'
      });
    }

    const doc = await Laporan.findOneAndUpdate(
      { tanggal: new Date(tanggal), idsubsls },
      {
        tanggal: new Date(tanggal), idsubsls, nmkec, nmdesa, nmsubsls, pencacah, pengawas,
        jumlah_keluarga_submit:  +jumlah_keluarga_submit  || 0,
        jumlah_usaha_submit:     +jumlah_usaha_submit     || 0,
        jumlah_bku_submit:       +jumlah_bku_submit       || 0,
        jumlah_bangunan_kosong:  +jumlah_bangunan_kosong  || 0,
        total_bangunan:          +total_bangunan           || 0,
        jumlah_belum_submit:     +jumlah_belum_submit      || 0,
        catatan_belum_submit:    catatan_belum_submit      || '',
        catatan:                 catatan                   || '',
      },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, laporan: doc });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE /api/laporan/:id — hanya boleh hapus laporan hari ini (proteksi data historis)
app.delete('/api/laporan/:id', async (req, res) => {
  try {
    const doc = await Laporan.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

    if (!isToday(doc.tanggal)) {
      return res.status(403).json({
        error: 'Laporan dari tanggal sebelumnya tidak dapat dihapus',
        code: 'DATE_NOT_TODAY'
      });
    }

    await Laporan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/laporan/:id — boleh edit laporan tanggal mana pun (tidak hanya hari ini)
app.put('/api/laporan/:id', async (req, res) => {
  try {
    const existing = await Laporan.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

    const {
      jumlah_keluarga_submit, jumlah_usaha_submit, jumlah_bku_submit,
      jumlah_bangunan_kosong, total_bangunan,
      jumlah_belum_submit, catatan_belum_submit,
      catatan
    } = req.body;

    const doc = await Laporan.findByIdAndUpdate(
      req.params.id,
      {
        jumlah_keluarga_submit:  +jumlah_keluarga_submit  || 0,
        jumlah_usaha_submit:     +jumlah_usaha_submit     || 0,
        jumlah_bku_submit:       +jumlah_bku_submit       || 0,
        jumlah_bangunan_kosong:  +jumlah_bangunan_kosong  || 0,
        total_bangunan:          +total_bangunan           || 0,
        jumlah_belum_submit:     +jumlah_belum_submit      || 0,
        catatan_belum_submit:    catatan_belum_submit      || '',
        catatan:                 catatan                   || '',
      },
      { new: true, runValidators: true }
    );
    res.json({ success: true, laporan: doc });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// GET /api/laporan/check — return data existing untuk tanggal + SLS apapun
// Frontend akan gunakan ini untuk menampilkan warning jika data sudah ada
app.get('/api/laporan/check', async (req, res) => {
  try {
    const { tanggal, idsubsls } = req.query;
    if (!tanggal || !idsubsls) return res.json(null);
    res.json(await Laporan.findOne({ tanggal: new Date(tanggal), idsubsls }).lean() || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/laporan/summary', async (req, res) => {
  try {
    const match = {};
    if (req.query.tanggal)   match.tanggal = new Date(req.query.tanggal);
    if (req.query.kecamatan) match.nmkec   = req.query.kecamatan;
    const [s] = await Laporan.aggregate([
      { $match: match },
      { $group: { _id: null,
          total_keluarga_submit:  { $sum: '$jumlah_keluarga_submit' },
          total_usaha_submit:     { $sum: '$jumlah_usaha_submit' },
          total_bku_submit:       { $sum: '$jumlah_bku_submit' },
          total_bangunan_kosong:  { $sum: '$jumlah_bangunan_kosong' },
          total_bangunan:         { $sum: '$total_bangunan' },
          total_belum_submit:     { $sum: '$jumlah_belum_submit' },
          jumlah_laporan:         { $sum: 1 },
          jumlah_pcl:             { $addToSet: '$pencacah' }
        }
      }
    ]);
    res.json(s || {
      total_keluarga_submit: 0, total_usaha_submit: 0, total_bku_submit: 0,
      total_bangunan_kosong: 0, total_bangunan: 0, total_belum_submit: 0,
      jumlah_laporan: 0, jumlah_pcl: []
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/laporan/rekap', async (req, res) => {
  try {
    const match = {};
    if (req.query.tanggal)   match.tanggal = new Date(req.query.tanggal);
    if (req.query.kecamatan) match.nmkec   = req.query.kecamatan;
    res.json(await Laporan.aggregate([
      { $match: match },
      { $group: { _id: { kecamatan: '$nmkec', desa: '$nmdesa' },
          total_keluarga_submit:  { $sum: '$jumlah_keluarga_submit' },
          total_usaha_submit:     { $sum: '$jumlah_usaha_submit' },
          total_bku_submit:       { $sum: '$jumlah_bku_submit' },
          total_bangunan_kosong:  { $sum: '$jumlah_bangunan_kosong' },
          total_bangunan:         { $sum: '$total_bangunan' },
          total_belum_submit:     { $sum: '$jumlah_belum_submit' },
          jumlah_laporan:         { $sum: 1 }
        }
      },
      { $sort: { '_id.kecamatan': 1, '_id.desa': 1 } }
    ]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/laporan', async (req, res) => {
  try {
    const { tanggal, pencacah, kecamatan, desa, page=1, limit=20 } = req.query;
    const q = {};
    if (tanggal)   q.tanggal  = new Date(tanggal);
    if (pencacah)  q.pencacah = new RegExp(pencacah, 'i');
    if (kecamatan) q.nmkec    = kecamatan;
    if (desa)      q.nmdesa   = desa;
    const skip = (Number(page)-1) * Number(limit);
    const [data, total] = await Promise.all([
      Laporan.find(q).sort({ tanggal:-1, created_at:-1 }).skip(skip).limit(Number(limit)).lean(),
      Laporan.countDocuments(q)
    ]);
    res.json({ data, total, page: Number(page), totalPages: Math.ceil(total/Number(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { tanggal_dari, tanggal_sampai, kecamatan } = req.query;
    const match = {};
    if (tanggal_dari || tanggal_sampai) {
      match.tanggal = {};
      if (tanggal_dari)   match.tanggal.$gte = new Date(tanggal_dari);
      if (tanggal_sampai) match.tanggal.$lte = new Date(tanggal_sampai);
    }
    if (kecamatan) match.nmkec = kecamatan;
    const rows = await Laporan.aggregate([
      { $match: match },
      { $group: { _id: '$pencacah',
          nmkec:            { $first: '$nmkec' },
          pengawas:         { $first: '$pengawas' },
          total_keluarga:   { $sum: '$jumlah_keluarga_submit' },
          total_usaha:      { $sum: '$jumlah_usaha_submit' },
          total_bku:        { $sum: '$jumlah_bku_submit' },
          total_bangunan:   { $sum: '$total_bangunan' },
          total_belum:      { $sum: '$jumlah_belum_submit' },
          hari_lapor:       { $sum: 1 },
          terakhir_lapor:   { $max: '$tanggal' }
        }
      },
      { $addFields: { total_terdata: { $add: ['$total_keluarga', '$total_usaha', '$total_bku'] } } },
      { $sort: { total_terdata: -1 } }
    ]);
    res.json(rows.map((r, i) => ({ ...r, rank: i+1 })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// BELUM LAPOR
// ═══════════════════════════════════════════
app.get('/api/belum-lapor', async (req, res) => {
  try {
    const { tanggal, kecamatan } = req.query;
    if (!tanggal) return res.status(400).json({ error: 'tanggal required' });
    const tgl = new Date(tanggal);
    const slsQuery = kecamatan ? { nmkec: kecamatan } : {};
    const [semuaSls, sudahLapor] = await Promise.all([
      Wilayah.find(slsQuery, { idsubsls:1, nmsubsls:1, nmkec:1, nmdesa:1, pencacah:1, pengawas:1, _id:0 }).lean(),
      Laporan.distinct('idsubsls', { tanggal: tgl, ...(kecamatan ? { nmkec: kecamatan } : {}) })
    ]);
    const sudahSet = new Set(sudahLapor);
    const belum = semuaSls.filter(s => !sudahSet.has(s.idsubsls));
    const byKec = belum.reduce((acc, s) => {
      if (!acc[s.nmkec]) acc[s.nmkec] = [];
      acc[s.nmkec].push(s);
      return acc;
    }, {});
    res.json({
      total_sls: semuaSls.length, sudah_lapor: sudahSet.size, belum_lapor: belum.length,
      pct_selesai: semuaSls.length > 0 ? ((sudahSet.size/semuaSls.length)*100).toFixed(1) : '0',
      by_kecamatan: byKec
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// TREND
// ═══════════════════════════════════════════
app.get('/api/trend', async (req, res) => {
  try {
    const { kecamatan, hari=7 } = req.query;
    const match = kecamatan ? { nmkec: kecamatan } : {};
    const trend = await Laporan.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$tanggal' } },
          total_keluarga_submit: { $sum: '$jumlah_keluarga_submit' },
          total_usaha_submit:    { $sum: '$jumlah_usaha_submit' },
          total_bku_submit:      { $sum: '$jumlah_bku_submit' },
          total_bangunan:        { $sum: '$total_bangunan' },
          total_belum_submit:    { $sum: '$jumlah_belum_submit' },
          jumlah_laporan:        { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: Number(hari) }
    ]);
    res.json(trend);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════
app.get('/api/export/csv', async (req, res) => {
  try {
    const { tanggal, kecamatan } = req.query;
    const match = {};
    if (tanggal)   match.tanggal = new Date(tanggal);
    if (kecamatan) match.nmkec   = kecamatan;
    const data = await Laporan.find(match).sort({ nmkec:1, nmdesa:1 }).lean();
    const header = 'Tanggal,Kecamatan,Desa,SLS,PCL,Pengawas,Kel Submit,Usaha Submit,BKU Submit,Bgn Kosong,Total Bangunan,Belum Submit,Catatan Belum Submit,Catatan\n';
    const rows = data.map(d => [
      new Date(d.tanggal).toLocaleDateString('id-ID'),
      d.nmkec, d.nmdesa, d.nmsubsls, d.pencacah, d.pengawas,
      d.jumlah_keluarga_submit  ?? 0,
      d.jumlah_usaha_submit     ?? 0,
      d.jumlah_bku_submit       ?? 0,
      d.jumlah_bangunan_kosong  ?? 0,
      d.total_bangunan          ?? 0,
      d.jumlah_belum_submit     ?? 0,
      `"${(d.catatan_belum_submit||'').replace(/"/g,'""')}"`,
      `"${(d.catatan||'').replace(/"/g,'""')}"`
    ].join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mata-se26-${tanggal||'all'}.csv"`);
    res.send('\uFEFF' + header + rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/laporan/p6-detail', async (req, res) => {
  try {
    const { tanggal, kecamatan } = req.query;
    const match = { jumlah_belum_submit: { $gt: 0 } };
    if (tanggal)   match.tanggal = new Date(tanggal);
    if (kecamatan) match.nmkec   = kecamatan;
    const rows = await Laporan.find(match, {
      nmkec: 1, nmdesa: 1, nmsubsls: 1,
      pencacah: 1, pengawas: 1,
      jumlah_belum_submit: 1,
      catatan_belum_submit: 1,
      catatan: 1,
      _id: 0,
    }).sort({ nmkec: 1, nmdesa: 1 }).lean();
    const byKec = rows.reduce((acc, r) => {
      const k = r.nmkec || 'Lainnya';
      if (!acc[k]) acc[k] = [];
      acc[k].push(r);
      return acc;
    }, {});
    res.json(byKec);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' };
  res.json({ status: 'ok', mongodb: states[state] || 'unknown', uptime: process.uptime() });
});

// ═══════════════════════════════════════════
// SERVE FRONTEND
// ═══════════════════════════════════════════
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get(/^(?!\/api).*/, (req, res) => {
    res.json({ app: 'MATA SE26 API', status: 'aktif', mongodb: mongoose.connection.readyState });
  });
}

// ═══════════════════════════════════════════
// START
// ═══════════════════════════════════════════
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('ERROR: MONGODB_URI environment variable tidak ditemukan!');
  process.exit(1);
}

console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
})
.then(() => {
  console.log('MongoDB connected!');
  app.listen(PORT, () => console.log(`MATA SE26 server running on port ${PORT}`));
})
.catch(err => {
  console.error('MongoDB connection FAILED:', err.message);
  process.exit(1);
});