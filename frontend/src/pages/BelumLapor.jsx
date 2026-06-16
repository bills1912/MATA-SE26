import { useState, useEffect } from 'react';
import DateInput, { todayStr, formatTanggal } from '../components/DateInput';
import SearchSelect from '../components/SearchSelect';
import { statsApi, wilayahApi } from '../utils/api';

export default function BelumLapor() {
  const [tanggal, setTanggal]     = useState(todayStr());
  const [kecamatan, setKecamatan] = useState('');
  const [kecamatanList, setKecamatanList] = useState([]);
  const [data, setData]           = useState(null);
  const [expanded, setExpanded]   = useState({});
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    wilayahApi.getKecamatan().then(r => setKecamatanList(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { tanggal };
    if (kecamatan) params.kecamatan = kecamatan;
    statsApi.getBelumLapor(params)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [tanggal, kecamatan]);

  const toggleKec = (kec) => setExpanded(e => ({ ...e, [kec]: !e[kec] }));

  const pct = data ? parseFloat(data.pct_selesai) : 0;
  const pctColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--rose)';

  return (
    <div className="page">
      <div className="filter-bar">
        <div className="filter-label">📡 Monitor SLS Belum Lapor</div>
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
        <div className="loading"><div className="spinner"/><div className="loading-text">Memeriksa SLS...</div></div>
      ) : !data ? (
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <div className="empty-title">Data tidak tersedia</div>
        </div>
      ) : (
        <>
          {/* Progress overview */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon green">📡</div>
              <div>
                <div className="card-title-text">Progress {formatTanggal(tanggal)}</div>
                <div className="card-title-sub">Cakupan pelaporan SLS</div>
              </div>
            </div>

            {/* Big progress */}
            <div style={{ textAlign:'center', marginBottom: 20 }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: pctColor, lineHeight: 1 }}>
                {data.pct_selesai}%
              </div>
              <div style={{ fontSize: 13, color:'var(--text2)', marginTop: 6 }}>
                SLS telah melapor
              </div>
            </div>

            <div className="prog-wrap" style={{ height: 10, marginBottom: 16 }}>
              <div className="prog-fill" style={{
                width: pct + '%',
                background: `linear-gradient(90deg, ${pctColor}, ${pctColor}aa)`
              }}/>
            </div>

            <div className="stats-grid" style={{ marginBottom: 0 }}>
              <div className="stat-card c-green">
                <div className="stat-icon">✅</div>
                <div className="stat-value" style={{ fontSize: 24 }}>{data.sudah_lapor}</div>
                <div className="stat-label">Sudah Lapor</div>
              </div>
              <div className="stat-card c-rose">
                <div className="stat-icon">⏳</div>
                <div className="stat-value" style={{ fontSize: 24 }}>{data.belum_lapor}</div>
                <div className="stat-label">Belum Lapor</div>
              </div>
            </div>

            <div className="info-row" style={{ marginTop: 12 }}>
              <span className="info-row-label">Total SLS</span>
              <span className="info-row-value">{data.total_sls} SLS</span>
            </div>
          </div>

          {/* Per-kecamatan collapsible */}
          <div className="sec-header">
            <div className="sec-title">📍 Detail per Kecamatan</div>
            <span className="badge badge-rose">{data.belum_lapor} SLS</span>
          </div>

          {Object.entries(data.by_kecamatan || {}).sort((a,b)=>b[1].length-a[1].length).map(([kec, sls]) => (
            <div className="bl-kec-card" key={kec}>
              <button className="bl-kec-header" onClick={() => toggleKec(kec)}>
                <div>
                  <div className="bl-kec-name">📍 {kec}</div>
                  <div className="bl-kec-sub">{sls.length} SLS belum lapor</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="badge badge-rose">{sls.length}</span>
                  <span style={{ color:'var(--text3)', fontSize:18 }}>{expanded[kec] ? '▲' : '▼'}</span>
                </div>
              </button>

              {expanded[kec] && (
                <div className="bl-sls-list">
                  {sls.map(s => (
                    <div className="bl-sls-item" key={s.idsubsls}>
                      <div>
                        <div className="bl-sls-name">{s.nmsubsls}</div>
                        <div className="bl-sls-desa">{s.nmdesa}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div className="bl-pcl">👤 {s.pencacah}</div>
                        <div className="bl-id">{s.idsubsls}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {Object.keys(data.by_kecamatan || {}).length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <div className="empty-title">Semua SLS sudah melapor!</div>
              <div className="empty-sub">Progress 100% pada {formatTanggal(tanggal)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
