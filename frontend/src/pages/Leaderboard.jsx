import { useState, useEffect } from 'react';
import DateInput, { todayStr } from '../components/DateInput';
import SearchSelect from '../components/SearchSelect';
import { statsApi, wilayahApi } from '../utils/api';

const MEDAL = ['🥇','🥈','🥉'];

export default function Leaderboard() {
  const [dari, setDari]         = useState(todayStr());
  const [sampai, setSampai]     = useState(todayStr());
  const [kecamatan, setKecamatan] = useState('');
  const [kecamatanList, setKecamatanList] = useState([]);
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    wilayahApi.getKecamatan().then(r => setKecamatanList(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { tanggal_dari: dari, tanggal_sampai: sampai };
    if (kecamatan) params.kecamatan = kecamatan;
    statsApi.getLeaderboard(params)
      .then(r => setData(r.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [dari, sampai, kecamatan]);

  const fmt = n => (n || 0).toLocaleString('id-ID');
  const maxTerdata = data[0]?.total_terdata || 1;

  return (
    <div className="page">
      {/* Filter */}
      <div className="filter-bar">
        <div className="filter-label">🏆 Leaderboard PCL</div>
        <div className="filter-bar-grid">
          <DateInput value={dari}   onChange={setDari}   label="Dari Tanggal" />
          <DateInput value={sampai} onChange={setSampai} label="Sampai Tanggal" />
        </div>
        <SearchSelect
          label="Kecamatan" icon="🏘️"
          placeholder="— Semua Kecamatan —"
          value={kecamatan} onChange={setKecamatan}
          options={kecamatanList}
        />
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"/><div className="loading-text">Memuat ranking...</div></div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <div className="empty-title">Belum ada data</div>
          <div className="empty-sub">Belum ada laporan pada periode ini</div>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {data.length >= 3 && (
            <div className="podium-row">
              {[data[1], data[0], data[2]].map((p, i) => p && (
                <div key={p._id} className={'podium-card' + (i===1 ? ' podium-first' : '')}>
                  <div className="podium-medal">{i===1 ? '🥇' : i===0 ? '🥈' : '🥉'}</div>
                  <div className="podium-rank">#{p.rank}</div>
                  <div className="podium-name">{p._id.split(' ').slice(0,2).join(' ')}</div>
                  <div className="podium-kec">{p.nmkec}</div>
                  <div className="podium-score">{fmt(p.total_terdata)}</div>
                  <div className="podium-score-label">unit terdata</div>
                </div>
              ))}
            </div>
          )}

          {/* Full table */}
          <div className="sec-header" style={{ marginTop: 16 }}>
            <div className="sec-title">📋 Semua PCL</div>
            <span className="badge badge-purple">{data.length} PCL</span>
          </div>

          {data.map((pcl, i) => (
            <div className="lb-card" key={pcl._id}>
              <div className="lb-rank">
                {i < 3 ? MEDAL[i] : <span className="lb-rank-num">#{pcl.rank}</span>}
              </div>
              <div className="lb-info">
                <div className="lb-name">{pcl._id}</div>
                <div className="lb-meta">
                  <span>📍 {pcl.nmkec}</span>
                  <span>👁️ {pcl.pengawas}</span>
                  <span>📅 {pcl.hari_lapor}x lapor</span>
                </div>
                {/* Progress bar relatif terhadap #1 */}
                <div style={{ marginTop: 8 }}>
                  <div className="prog-wrap">
                    <div className="prog-fill" style={{
                      width: (pcl.total_terdata / maxTerdata * 100) + '%',
                      background: i===0
                        ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                        : i===1
                        ? 'linear-gradient(90deg,#6366f1,#8b5cf6)'
                        : 'linear-gradient(90deg,#10b981,#34d399)'
                    }}/>
                  </div>
                </div>
              </div>
              <div className="lb-scores">
                <div className="lb-score-main">{fmt(pcl.total_terdata)}</div>
                <div className="lb-score-label">terdata</div>
                <div className="lb-chips">
                  <span className="lb-chip">🏢 {fmt(pcl.total_usaha)}</span>
                  <span className="lb-chip">🏠 {fmt(pcl.total_keluarga)}</span>
                  <span className="lb-chip">🏗️ {fmt(pcl.total_bangunan)}</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
