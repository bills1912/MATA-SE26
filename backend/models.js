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
  // Data progress (sesuai metadata_progres_harian)
  jumlah_keluarga_non_usaha: { type: Number, default: 0, min: 0 },
  jumlah_usaha: { type: Number, default: 0, min: 0 },
  jumlah_bangunan_kosong: { type: Number, default: 0, min: 0 },
  total_bangunan: { type: Number, default: 0, min: 0 },
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
