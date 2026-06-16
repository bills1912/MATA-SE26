import { Toaster } from 'react-hot-toast';
import FormLaporan from './pages/FormLaporan';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './utils/ThemeContext';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
dayjs.locale('id');

export default function App() {
  useTheme(); // aktifkan theme system

  return (
    <div className="app-shell">
      <Toaster position="top-center" toastOptions={{
        duration: 3500,
        style: {
          background: 'var(--toast-bg)', color: 'var(--text)',
          border: '1px solid rgba(99,102,241,0.35)', borderRadius: '12px',
          fontWeight: 600, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
        success: { iconTheme: { primary: '#10b981', secondary: 'var(--toast-bg)' } },
        error:   { iconTheme: { primary: '#f43f5e', secondary: 'var(--toast-bg)' } },
      }}/>

      {/* ══ HEADER ══ */}
      <header className="app-header">
        {/* Dekorasi blur blob di background */}
        <div className="header-blob header-blob-1" />
        <div className="header-blob header-blob-2" />

        <div className="header-inner">
          {/* Kiri — logo + identitas */}
          <div className="header-left">
            <div className="header-logo-box">
              <span className="header-logo-icon">👁️</span>
            </div>
            <div className="header-titles">
              <div className="header-app-name">MATA SE26</div>
              <div className="header-app-sub">Monitoring Aktivitas Terpadu · Sensus Ekonomi 2026</div>
            </div>
          </div>

          {/* Kanan — tanggal + theme toggle */}
          <div className="header-right">
            <div className="header-date-block">
              <div className="header-date-day">{dayjs().format('dddd')}</div>
              <div className="header-date-full">{dayjs().format('D MMMM YYYY')}</div>
            </div>
            <div className="header-divider" />
            <ThemeToggle />
          </div>
        </div>

        {/* Badge bawah header */}
        <div className="header-badge-row">
          <span className="header-badge">BPS Kab. Padang Lawas Utara</span>
          <span className="header-badge">Sumatera Utara</span>
          <span className="header-badge header-badge-live">
            <span className="live-dot" />
            Live
          </span>
        </div>
      </header>

      {/* ══ KONTEN ══ */}
      <main className="app-main">
        <FormLaporan />
      </main>
    </div>
  );
}
