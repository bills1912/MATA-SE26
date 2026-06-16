import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DateInput, { formatTanggal } from '../components/DateInput';
import SearchSelect from '../components/SearchSelect';
import EditModal    from '../components/EditModal';
import ConfirmModal from '../components/ConfirmModal';
import { laporanApi, wilayahApi } from '../utils/api';

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

  // Modal state
  const [editItem,    setEditItem]    = useState(null); // laporan yang sedang di-edit
  const [deleteItem,  setDeleteItem]  = useState(null); // laporan yang mau dihapus
  const [deleting,    setDeleting]    = useState(false);

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
      toast.error('Gagal menghapus: ' + (err.response?.data?.error || err.message));
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
            {data.map((item) => (
              <div
                key={item._id}
                className={'list-item ' + (item.jumlah_usaha > 0 ? 'green-accent' : 'purple-accent')}
              >
                {/* Baris atas: lokasi + tanggal */}
                <div className="list-item-head">
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <div className="list-item-title">{item.nmdesa}</div>
                    <div className="list-item-sub">{item.nmkec} · {item.nmsubsls}</div>
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {getDateLabel(item.tanggal)}
                  </span>
                </div>

                {/* PCL */}
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>👤</span> {item.pencacah}
                </div>

                {/* Data chips */}
                <div className="chip-row">
                  <div className="chip">🏢 <strong>{fmt(item.jumlah_usaha)}</strong> usaha</div>
                  <div className="chip">🏠 <strong>{fmt(item.jumlah_keluarga_non_usaha)}</strong> kel</div>
                  <div className="chip">🏗️ <strong>{fmt(item.total_bangunan)}</strong> bgn</div>
                  {item.jumlah_bangunan_kosong > 0 && (
                    <div className="chip">⬜ <strong>{fmt(item.jumlah_bangunan_kosong)}</strong> kosong</div>
                  )}
                </div>

                {/* Catatan */}
                {item.catatan && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    📝 {item.catatan}
                  </div>
                )}

                {/* Tombol aksi */}
                <div className="item-actions">
                  <button
                    className="action-btn action-btn-edit"
                    onClick={() => setEditItem(item)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="action-btn action-btn-delete"
                    onClick={() => setDeleteItem(item)}
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))}
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
