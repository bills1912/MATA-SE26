import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DateInput, { formatTanggal, todayStr } from '../components/DateInput';
import SearchSelect from '../components/SearchSelect';
import EditModal    from '../components/EditModal';
import ConfirmModal from '../components/ConfirmModal';
import { laporanApi, wilayahApi } from '../utils/api';

// Helper — apakah tanggal string = hari ini (lokal)
function isToday(dateValue) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth()    === today.getMonth()    &&
    d.getDate()     === today.getDate()
  );
}

export default function Riwayat() {
  const [tanggal,      setTanggal]      = useState('');
  const [kecamatan,    setKecamatan]    = useState('');
  const [pencacah,     setPencacah]     = useState('');
  const [kecamatanList,setKecamatanList]= useState([]);
  const [data,         setData]         = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [loading,      setLoading]      = useState(false);

  const [editItem,   setEditItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  useEffect(() => {
    wilayahApi.getKecamatan().then(r => setKecamatanList(r.data)).catch(() => {});
  }, []);

  const loadData = (pg = 1) => {
    setLoading(true);
    const params = { page: pg, limit: 20 };
    if (tanggal)   params.tanggal   = tanggal;
    if (kecamatan) params.kecamatan = kecamatan;
    if (pencacah)  params.pencacah  = pencacah;
    laporanApi.getList(params)
      .then(r => {
        setData(r.data.data);
        setTotal(r.data.total);
        setTotalPages(r.data.totalPages);
        setPage(pg);
      })
      .catch(() => { setData([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(1); }, [tanggal, kecamatan, pencacah]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await laporanApi.delete(deleteItem._id);
      toast.success('🗑️ Laporan berhasil dihapus');
      setDeleteItem(null);
      loadData(page);
    } catch (err) {
      // Tangkap error 403 dari backend
      const msg = err.response?.data?.error || err.message;
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const fmt = n => (n || 0).toLocaleString('id-ID');

  const getDateLabel = (d) => {
    const full = formatTanggal(d);
    const parts = full.split(',');
    return parts.length > 1 ? parts.slice(1).join(',').trim() : full;
  };

  // Hitung berapa item yang bisa diedit (hari ini)
  const countEditable = data.filter(item => isToday(item.tanggal)).length;
  const countLocked   = data.length - countEditable;

  return (
    <div className="page">

      {/* Filter */}
      <div className="filter-bar">
        <div className="filter-label">🔍 Filter Riwayat</div>
        <DateInput value={tanggal} onChange={setTanggal} label="Tanggal" placeholder="— Semua Tanggal —" />
        {tanggal && (
          <button className="btn-clear" onClick={() => setTanggal('')}>✕ Hapus filter tanggal</button>
        )}
        <div style={{ marginTop: 10 }}>
          <SearchSelect
            label="Kecamatan" icon="🏘️"
            placeholder="— Semua Kecamatan —"
            value={kecamatan} onChange={setKecamatan}
            options={kecamatanList}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="form-label">Cari Nama PCL</div>
          <input className="form-control" value={pencacah}
            onChange={e => setPencacah(e.target.value)} placeholder="Ketik nama pencacah..." />
        </div>
      </div>

      {/* Header list */}
      <div className="sec-header">
        <div className="sec-title">📑 Riwayat Laporan</div>
        <span className="badge badge-purple">{total.toLocaleString('id-ID')} data</span>
      </div>

      {/* Banner kunci — muncul kalau ada laporan lama di halaman ini */}
      {!loading && countLocked > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 14 }}>
          <span>🔒</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {countLocked} laporan dari hari sebelumnya dikunci
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Laporan yang sudah disubmit di hari sebelumnya hanya dapat dilihat, tidak dapat diubah atau dihapus.
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner"/><div className="loading-text">Memuat riwayat...</div></div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">Tidak ada data</div>
          <div className="empty-sub">Coba ubah filter pencarian</div>
        </div>
      ) : (
        <>
          <div className="riwayat-grid">
            {data.map((item) => {
              const editable = isToday(item.tanggal);
              return (
                <div
                  key={item._id}
                  className={'list-item ' + (item.jumlah_usaha_submit > 0 ? 'green-accent' : 'purple-accent')}
                  style={!editable ? { opacity: 0.82 } : {}}
                >
                  {/* Baris atas: lokasi + tanggal */}
                  <div className="list-item-head">
                    <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                      <div className="list-item-title">{item.nmdesa}</div>
                      <div className="list-item-sub">{item.nmkec} · {item.nmsubsls}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span className="badge badge-amber" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                        {getDateLabel(item.tanggal)}
                      </span>
                      {/* Badge kunci untuk laporan lama */}
                      {!editable && (
                        <span className="badge" style={{
                          fontSize: 10, whiteSpace: 'nowrap',
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text3)',
                          border: '1px solid var(--border)',
                        }}>
                          🔒 Dikunci
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PCL */}
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>👤</span> {item.pencacah}
                  </div>

                  {/* Data chips */}
                  <div className="chip-row">
                    <div className="chip">🏢 <strong>{fmt(item.jumlah_usaha_submit)}</strong> usaha</div>
                    <div className="chip">🏠 <strong>{fmt(item.jumlah_keluarga_submit)}</strong> kel</div>
                    <div className="chip">🏗️ <strong>{fmt(item.total_bangunan)}</strong> bgn</div>
                    {item.jumlah_bangunan_kosong > 0 && (
                      <div className="chip">⬜ <strong>{fmt(item.jumlah_bangunan_kosong)}</strong> kosong</div>
                    )}
                    {item.jumlah_belum_submit > 0 && (
                      <div className="chip" style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#fcd34d' }}>
                        ⏳ <strong>{fmt(item.jumlah_belum_submit)}</strong> blm submit
                      </div>
                    )}
                  </div>

                  {/* Catatan belum submit */}
                  {item.catatan_belum_submit && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#fcd34d', fontStyle: 'italic', lineHeight: 1.5 }}>
                      ⏳ {item.catatan_belum_submit}
                    </div>
                  )}

                  {/* Catatan umum */}
                  {item.catatan && (
                    <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      📝 {item.catatan}
                    </div>
                  )}

                  {/* Tombol aksi — hanya tampil jika hari ini */}
                  {editable ? (
                    <div className="item-actions">
                      <button className="action-btn action-btn-edit" onClick={() => setEditItem(item)}>
                        ✏️ Edit
                      </button>
                      <button className="action-btn action-btn-delete" onClick={() => setDeleteItem(item)}>
                        🗑️ Hapus
                      </button>
                    </div>
                  ) : (
                    /* Keterangan read-only untuk laporan lama */
                    <div style={{
                      marginTop: 10, paddingTop: 8,
                      borderTop: '1px solid var(--border)',
                      fontSize: 11, color: 'var(--text3)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      🔒 Laporan ini sudah terkunci — hanya dapat dilihat
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => loadData(page - 1)} disabled={page <= 1 || loading}>← Prev</button>
              <span className="page-info">{page} / {totalPages}</span>
              <button className="page-btn" onClick={() => loadData(page + 1)} disabled={page >= totalPages || loading}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editItem && (
        <EditModal
          laporan={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => loadData(page)}
        />
      )}

      {/* Confirm Delete Modal */}
      {deleteItem && (
        <ConfirmModal
          title="Hapus Laporan"
          message={`Hapus laporan "${deleteItem.nmdesa} — ${deleteItem.nmsubsls}" tanggal ${getDateLabel(deleteItem.tanggal)}?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteItem(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}