# MATA SE26 — Monitoring Aktivitas Terpadu Sensus Ekonomi 2026

Aplikasi web mobile-first untuk petugas lapangan SE2026 Kabupaten Padang Lawas Utara.

## Stack
- **Frontend**: React 18 + Vite (mobile-first responsive)
- **Backend**: Express.js (Node.js)
- **Database**: MongoDB Atlas

## Fitur
- 📝 Form pelaporan harian dengan date picker
- 📊 Dashboard summary progress per tanggal
- 🗺️ Rekap per kecamatan dengan progress bar
- 📋 Riwayat laporan dengan filter
- ✏️ Edit laporan yang sudah ada (upsert by tanggal + SLS)
- 🔢 Number input mobile-friendly (tombol +/-)

## Setup Development

### 1. Seed Database (jalankan sekali)
```bash
cd backend
npm install
node seed.js
```

### 2. Backend
```bash
cd backend
npm run dev
# Berjalan di http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Berjalan di http://localhost:5173
```

## Deploy ke Railway

### Cara 1: Via Railway CLI
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Cara 2: Via GitHub
1. Push project ke GitHub repository baru
2. Buka railway.app → New Project → Deploy from GitHub
3. Pilih repository ini
4. Set Environment Variables:
   - `MONGODB_URI` = `mongodb+srv://ricardozalukhu1925:kuran1925@cluster0.lhmox.mongodb.net/se2026?appName=Cluster0`
   - `PORT` = `5000`
5. Railway akan auto-build dan deploy

### Setelah Deploy
Jalankan seed untuk isi database:
```bash
railway run "cd backend && node seed.js"
```
Atau via Railway Dashboard → Open Terminal → `cd backend && node seed.js`

### ⚠️ Penting: Whitelist IP di MongoDB Atlas
1. Buka MongoDB Atlas → Network Access
2. Tambah IP: `0.0.0.0/0` (allow all) untuk Railway
3. Atau tambah IP spesifik Railway instance Anda

## Struktur Project
```
se2026-app/
├── backend/
│   ├── index.js          # Express server + API routes
│   ├── models.js         # Mongoose models (Wilayah, Laporan)
│   ├── seed.js           # Seed data dari Excel
│   ├── wilayah_data.json # Data 1129 SLS dari Excel
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── FormLaporan.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RekapKecamatan.jsx
│   │   │   └── Riwayat.jsx
│   │   ├── components/
│   │   │   └── NumberInput.jsx
│   │   └── utils/
│   │       └── api.js
│   └── package.json
├── railway.json
└── README.md
```

## Data
- **1129 SLS/Sub-SLS** dari 12 kecamatan di Padang Lawas Utara
- **195 PCL** (Pencacah) dan **29 PML** (Pengawas)
