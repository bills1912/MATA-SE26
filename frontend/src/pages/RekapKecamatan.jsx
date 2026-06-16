import { useState, useEffect } from 'react';
import DateInput, { todayStr, formatTanggal } from '../components/DateInput';
import { laporanApi } from '../utils/api';

export default function RekapKecamatan() {
  const [tanggal, setTanggal] = useState(todayStr());
  const [rekap, setRekap] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    laporanApi.getRekap({ tanggal })
      .then(r => setRekap(r.data))
      .catch(() => setRekap([]))
      .finally(() => setLoading(false));
  }, [tanggal]);

  const byKec = rekap.reduce((acc, r) => {
    const kec = r._id.kecamatan;
    if (!acc[kec]) acc[kec] = { laporan: 0, usaha: 0, keluarga: 0, kosong: 0, bangunan: 0 };
    acc[kec].laporan += r.jumlah_laporan;
    acc[kec].usaha += r.total_usaha;
    acc[kec].keluarga += r.total_keluarga_non_usaha;
    acc[kec].kosong += r.total_bangunan_kosong;
    acc[kec].bangunan += r.total_bangunan;
    return acc;
  }, {});

  const kecList = Object.entries(byKec).sort((a, b) => a[0].localeCompare(b[0]));
  const total = kecList.reduce((acc, [, v]) => ({
    laporan: acc.laporan + v.laporan,
    usaha: acc.usaha + v.usaha,
    keluarga: acc.keluarga + v.keluarga,
    kosong: acc.kosong + v.kosong,
    bangunan: acc.bangunan + v.bangunan,
  }), { laporan: 0, usaha: 0, keluarga: 0, kosong: 0, bangunan: 0 });

  const fmt = n => (n || 0).toLocaleString('id-ID');

  return (
    <div className="page">
      <div className="filter-bar">
        <div className="filter-label">🗺️ Rekap Kecamatan</div>
        <DateInput value={tanggal} onChange={setTanggal} />
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <div className="loading-text">Memuat rekap...</div>
        </div>
      ) : kecList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <div className="empty-title">Belum ada data</div>
          <div className="empty-sub">Belum ada laporan pada {formatTanggal(tanggal)}</div>
        </div>
      ) : (
        <>
          {/* Total */}
          <div className="stats-grid">
            <div className="stat-card c-purple">
              <div className="stat-icon">🏘️</div>
              <div className="stat-value">{kecList.length}</div>
              <div className="stat-label">Kecamatan</div>
            </div>
            <div className="stat-card c-green">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{fmt(total.usaha + total.keluarga)}</div>
              <div className="stat-label">Total Terdata</div>
            </div>
            <div className="stat-card c-amber">
              <div className="stat-icon">🏢</div>
              <div className="stat-value">{fmt(total.usaha)}</div>
              <div className="stat-label">Total Usaha</div>
            </div>
            <div className="stat-card c-rose">
              <div className="stat-icon">🏗️</div>
              <div className="stat-value">{fmt(total.bangunan)}</div>
              <div className="stat-label">Total Bangunan</div>
            </div>
          </div>

          {/* Per kecamatan */}
          {kecList.map(([kec, v]) => {
            const pct = total.bangunan > 0 ? (v.bangunan / total.bangunan * 100) : 0;
            return (
              <div className="kec-card" key={kec}>
                <div className="kec-header">
                  <div className="kec-name">📍 {kec}</div>
                  <span className="badge badge-purple">{v.laporan} SLS</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Keluarga Non-Usaha</span>
                  <span className="info-row-value">{fmt(v.keluarga)}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Usaha</span>
                  <span className="info-row-value">{fmt(v.usaha)}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Bangunan Kosong</span>
                  <span className="info-row-value">{fmt(v.kosong)}</span>
                </div>
                <div className="info-row" style={{ marginBottom: 10 }}>
                  <span className="info-row-label">Total Bangunan Stiker</span>
                  <span className="info-row-value" style={{ color: '#a5b4fc' }}>{fmt(v.bangunan)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600 }}>
                  Proporsi bangunan: {pct.toFixed(1)}%
                </div>
                <div className="prog-wrap">
                  <div className="prog-fill" style={{ width: pct + '%' }} />
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
