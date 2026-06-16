const mongoose = require('mongoose');

// Schema wilayah tugas (dari Excel)
const WilayahSchema = new mongoose.Schema({
  kdprov: Number,
  kdkab: Number,
  kdkec: Number,
  kddesa: Number,
  kdsls: Number,
  kdsubsls: Number,
  pengawas: String,
  pencacah: String,
  email_pengawas: String,
  email_pencacah: String,
  idsubsls: { type: String, unique: true },
  nmprov: String,
  nmkab: String,
  nmkec: String,
  nmdesa: String,
  nmsls: String,
  nmsubsls: String
});

// Schema laporan progress harian
const LaporanSchema = new mongoose.Schema({
  tanggal: { type: Date, required: true },
  idsubsls: { type: String, required: true },
  // Data wilayah snapshot
  nmkec: String,
  nmdesa: String,
  nmsubsls: String,
  pencacah: String,
  pengawas: String,
  // Data progress — field baru (P1–P6)
  jumlah_keluarga_submit:  { type: Number, default: 0, min: 0 }, // P1: keluarga non-usaha berhasil submit
  jumlah_usaha_submit:     { type: Number, default: 0, min: 0 }, // P2: keluarga usaha berhasil submit
  jumlah_bku_submit:       { type: Number, default: 0, min: 0 }, // P3: BKU berhasil submit
  jumlah_bangunan_kosong:  { type: Number, default: 0, min: 0 }, // P4: bangunan kosong/non-hunian
  total_bangunan:          { type: Number, default: 0, min: 0 }, // P5: total bangunan disticker
  jumlah_belum_submit:     { type: Number, default: 0, min: 0 }, // P6: sudah didata tapi belum submit
  catatan_belum_submit:    { type: String, default: '' },        // wajib jika P6 > 0
  // Metadata
  catatan: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Index untuk query cepat
LaporanSchema.index({ tanggal: 1, idsubsls: 1 }, { unique: true });
LaporanSchema.index({ pencacah: 1 });
LaporanSchema.index({ nmkec: 1 });

const Wilayah = mongoose.model('Wilayah', WilayahSchema);
const Laporan = mongoose.model('Laporan', LaporanSchema);

module.exports = { Wilayah, Laporan };
