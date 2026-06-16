# MATA SE26 — Frontend (Aplikasi Pelaporan)

## Deploy ke Railway

### Langkah 1 — Push ke GitHub
```bash
git init
git add -A
git commit -m "initial: MATA SE26 frontend"
git remote add origin https://github.com/USERNAME/mata-se26-frontend.git
git push -u origin main
```

### Langkah 2 — Deploy di Railway
1. Railway → New Project → Deploy from GitHub → pilih repo ini
2. Set environment variable di Railway Dashboard > Variables:
   ```
   VITE_API_URL = https://mata-se26-backend.up.railway.app/api
   ```
   (ganti dengan URL backend Railway Anda yang sebenarnya)
3. Railway akan otomatis build dan deploy

### Development Lokal
```bash
npm install
# Buat file .env.local
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
npm run dev
```
