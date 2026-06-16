import { useState, useEffect } from 'react';
import DateInput, { todayStr, formatTanggal } from '../components/DateInput';
import SearchSelect from '../components/SearchSelect';
import { laporanApi, wilayahApi, statsApi } from '../utils/api';

export default function Dashboard() {
  const [tanggal, setTanggal]       = useState(todayStr());
  const [kecamatan, setKecamatan]   = useState('');
  const [kecamatanList, setKecamatanList] = useState([]);
  const [summary, setSummary]       = useState(null);
  const [rekap, setRekap]           = useState([]);
  const [trend, setTrend]           = useState([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    wilayahApi.getKecamatan().then(r => setKecamatanList(r.data)).catch(() => {});
    statsApi.getTrend({ hari: 7 }).then(r => setTrend(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { tanggal };
    if (kecamatan) params.kecamatan = kecamatan;
    Promise.all([laporanApi.getSummary(params), laporanApi.getRekap(params)])
      .then(([s, r]) => { setSummary(s.data); setRekap(r.data); })
      .catch(() => { setSummary(null); setRekap([]); })
      .finally(() => setLoading(false));
  }, [tanggal, kecamatan]);

  const fmt = n => (n || 0).toLocaleString('id-ID');

  // Trend chart helpers
  const trendMax = Math.max(...trend.map(t => t.total_usaha + t.total_keluarga), 1);
  const trendDays = trend.slice(-7);

  const handleExport = () => {
    const params = { tanggal };
    if (kecamatan) params.kecamatan = kecamatan;
    statsApi.exportCsv(params);
  };

  return (
    <div className="page">
      {/* Filter */}
      <div className="filter-bar">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
          <div className="filter-label" style={{ marginBottom: 0 }}>🔍 Filter Dashboard</div>
          <button className="btn-export" onClick={handleExport} title="Export CSV">
            ⬇️ Export CSV
          </button>
        </div>
        <div className="filter-bar-grid">
          <DateInput value={tanggal} onChange={setTanggal} label="Tanggal" />
          <SearchSelect
            label="Kecamatan" icon="🏘️"
            placeholder="— Semua Kecamatan —"
            value={kecamatan} onChange={setKecamatan}
            options={kecamatanList}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"/><div className="loading-text">Memuat data...</div></div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card c-purple">
              <div className="stat-icon">📋</div>
              <div className="stat-value">{fmt(summary?.jumlah_laporan)}</div>
              <div className="stat-label">Laporan Masuk</div>
            </div>
            <div className="stat-card c-green">
              <div className="stat-icon">🏢</div>
              <div className="stat-value">{fmt(summary?.total_usaha)}</div>
              <div className="stat-label">Total Usaha</div>
            </div>
            <div className="stat-card c-amber">
              <div className="stat-icon">🏠</div>
              <div className="stat-value">{fmt(summary?.total_keluarga_non_usaha)}</div>
              <div className="stat-label">Kel. Non-Usaha</div>
            </div>
            <div className="stat-card c-rose">
              <div className="stat-icon">🏗️</div>
              <div className="stat-value">{fmt(summary?.total_bangunan)}</div>
              <div className="stat-label">Total Bangunan</div>
            </div>
          </div>

          {/* Trend chart */}
          {trendDays.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-icon purple">📈</div>
                <div>
                  <div className="card-title-text">Trend Pendataan</div>
                  <div className="card-title-sub">Unit terdata per hari</div>
                </div>
              </div>
              <div className="trend-chart">
                {trendDays.map((t, i) => {
                  const val = t.total_usaha + t.total_keluarga;
                  const h = Math.max((val / trendMax) * 100, 4);
                  const day = t._id.slice(5); // MM-DD
                  return (
                    <div key={i} className="trend-col">
                      <div className="trend-val">{val > 999 ? (val/1000).toFixed(1)+'k' : val}</div>
                      <div className="trend-bar-wrap">
                        <div className="trend-bar" style={{ height: h + '%' }}/>
                      </div>
                      <div className="trend-day">{day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon blue">📊</div>
              <div>
                <div className="card-title-text">Ringkasan {formatTanggal(tanggal)}</div>
                <div className="card-title-sub">Akumulasi seluruh laporan</div>
              </div>
            </div>
            <div className="info-row">
              <span className="info-row-label">PCL Aktif Melapor</span>
              <span className="info-row-value">
                <span className="badge badge-purple">{(summary?.jumlah_pcl||[]).length} PCL</span>
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Bangunan Kosong</span>
              <span className="info-row-value">{fmt(summary?.total_bangunan_kosong)}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Total Unit Terdata</span>
              <span className="info-row-value" style={{ color:'#a5b4fc' }}>
                {fmt((summary?.total_keluarga_non_usaha||0)+(summary?.total_usaha||0))}
              </span>
            </div>
          </div>

          {/* Rekap per desa */}
          <div className="sec-header">
            <div className="sec-title">📍 Rekap per Desa</div>
            <span className="badge badge-purple">{rekap.length} desa</span>
          </div>

          {rekap.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">Belum ada laporan</div>
              <div className="empty-sub">Pada {formatTanggal(tanggal)}</div>
            </div>
          ) : (
            <div className="riwayat-grid">
              {rekap.map((r, i) => (
                <div className="list-item purple-accent" key={i}>
                  <div className="list-item-head">
                    <div>
                      <div className="list-item-title">{r._id.desa}</div>
                      <div className="list-item-sub">{r._id.kecamatan}</div>
                    </div>
                    <span className="badge badge-green">{r.jumlah_laporan} SLS</span>
                  </div>
                  <div className="chip-row">
                    <div className="chip">🏢 <strong>{fmt(r.total_usaha)}</strong></div>
                    <div className="chip">🏠 <strong>{fmt(r.total_keluarga_non_usaha)}</strong></div>
                    <div className="chip">🏗️ <strong>{fmt(r.total_bangunan)}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
