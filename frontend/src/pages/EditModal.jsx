import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import NumberInput from './NumberInput';
import { laporanApi } from '../utils/api';
import { formatTanggal } from './DateInput';

export default function EditModal({ laporan, onClose, onSaved }) {
  const [keluargaSubmit,    setKeluargaSubmit]    = useState(laporan.jumlah_keluarga_submit ?? 0);
  const [usahaSubmit,       setUsahaSubmit]        = useState(laporan.jumlah_usaha_submit ?? 0);
  const [bkuSubmit,         setBkuSubmit]          = useState(laporan.jumlah_bku_submit ?? 0);
  const [bangunanKosong,    setBangunanKosong]     = useState(laporan.jumlah_bangunan_kosong ?? 0);
  const [totalBangunan,     setTotalBangunan]      = useState(laporan.total_bangunan ?? 0);
  const [belumSubmit,       setBelumSubmit]        = useState(laporan.jumlah_belum_submit ?? 0);
  const [catatanBelumSubmit, setCatatanBelumSubmit] = useState(laporan.catatan_belum_submit ?? '');
  const [catatan,           setCatatan]            = useState(laporan.catatan ?? '');
  const [saving,            setSaving]             = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isDirty =
    keluargaSubmit    !== (laporan.jumlah_keluarga_submit ?? 0) ||
    usahaSubmit       !== (laporan.jumlah_usaha_submit ?? 0) ||
    bkuSubmit         !== (laporan.jumlah_bku_submit ?? 0) ||
    bangunanKosong    !== (laporan.jumlah_bangunan_kosong ?? 0) ||
    totalBangunan     !== (laporan.total_bangunan ?? 0) ||
    belumSubmit       !== (laporan.jumlah_belum_submit ?? 0) ||
    catatanBelumSubmit !== (laporan.catatan_belum_submit ?? '') ||
    catatan           !== (laporan.catatan ?? '');

  const handleSave = async () => {
    if (belumSubmit > 0 && !catatanBelumSubmit.trim()) {
      toast.error('Catatan kendala wajib diisi jika ada responden yang belum submit');
      return;
    }
    setSaving(true);
    try {
      await laporanApi.update(laporan._id, {
        jumlah_keluarga_submit:  keluargaSubmit,
        jumlah_usaha_submit:     usahaSubmit,
        jumlah_bku_submit:       bkuSubmit,
        jumlah_bangunan_kosong:  bangunanKosong,
        total_bangunan:          totalBangunan,
        jumlah_belum_submit:     belumSubmit,
        catatan_belum_submit:    catatanBelumSubmit,
        catatan,
      });
      toast.success('✅ Laporan berhasil diperbarui!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Gagal menyimpan: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">✏️</div>
            <div>
              <div className="modal-title">Edit Laporan</div>
              <div className="modal-sub">{formatTanggal(laporan.tanggal)}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Tutup (Esc)">✕</button>
        </div>

        {/* Info wilayah — readonly */}
        <div className="modal-info-strip">
          <div className="modal-info-row">
            <span className="modal-info-label">Wilayah</span>
            <span className="modal-info-val">{laporan.nmdesa}, {laporan.nmkec}</span>
          </div>
          <div className="modal-info-row">
            <span className="modal-info-label">SLS</span>
            <span className="modal-info-val">{laporan.nmsubsls}</span>
          </div>
          <div className="modal-info-row">
            <span className="modal-info-label">PCL</span>
            <span className="modal-info-val">👤 {laporan.pencacah}</span>
          </div>
        </div>

        {/* Form */}
        <div className="modal-body">
          <NumberInput
            label="1. Jumlah Keluarga yang Berhasil Disubmit"
            value={keluargaSubmit} onChange={setKeluargaSubmit}
            helpText="Keluarga non-usaha yang sudah berhasil disubmit"
          />
          <NumberInput
            label="2. Jumlah Usaha dari Keluarga yang Berhasil Disubmit"
            value={usahaSubmit} onChange={setUsahaSubmit}
            helpText="Keluarga yang memiliki usaha dan sudah berhasil disubmit"
          />
          <NumberInput
            label="3. Jumlah BKU yang Berhasil Disubmit"
            value={bkuSubmit} onChange={setBkuSubmit}
            helpText="Bangunan Khusus Usaha yang sudah berhasil disubmit"
          />
          <NumberInput
            label="4. Jumlah Bangunan Kosong / Non-Hunian"
            value={bangunanKosong} onChange={setBangunanKosong}
            helpText="Tempat ibadah, gedung kosong, non-hunian"
          />
          <NumberInput
            label="5. Total Bangunan Sudah Disticker"
            value={totalBangunan} onChange={setTotalBangunan}
            helpText="Jumlah bangunan yang sudah diberi stiker SE2026"
          />

          <div style={{
            margin: '4px 0 14px',
            borderTop: '1px dashed var(--border)',
            paddingTop: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              ⏳ Responden Belum Submit
            </div>
          </div>

          <NumberInput
            label="6. Jumlah Responden Sudah Didata tapi Belum Submit"
            value={belumSubmit} onChange={setBelumSubmit}
            helpText="Responden sudah wawancara tapi gagal disubmit"
          />

          {belumSubmit > 0 && (
            <div className="form-group">
              <div className="form-label" style={{ color: 'var(--amber)' }}>
                Catatan Kendala / Alasan Belum Submit <span className="req">*</span>
              </div>
              <textarea
                className="form-control"
                value={catatanBelumSubmit}
                onChange={e => setCatatanBelumSubmit(e.target.value)}
                rows={3}
                placeholder="Jelaskan kendala atau alasan belum berhasil disubmit..."
                style={{
                  resize: 'vertical', minHeight: 72, lineHeight: 1.5,
                  borderColor: catatanBelumSubmit.trim() ? 'var(--border)' : 'rgba(245,158,11,0.5)',
                }}
              />
              {!catatanBelumSubmit.trim() && (
                <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 5, fontWeight: 600 }}>
                  ⚠️ Wajib diisi
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <div className="form-label">Catatan / Kendala Lapangan (Opsional)</div>
            <textarea
              className="form-control"
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={3}
              placeholder="Catatan lapangan..."
              style={{ resize: 'vertical', minHeight: 72, lineHeight: 1.5 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            className="modal-btn-save"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
