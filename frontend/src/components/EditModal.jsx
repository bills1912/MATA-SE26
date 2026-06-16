import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import NumberInput from './NumberInput';
import { laporanApi } from '../utils/api';
import { formatTanggal } from './DateInput';

export default function EditModal({ laporan, onClose, onSaved }) {
  const [kel,      setKel]      = useState(laporan.jumlah_keluarga_non_usaha);
  const [usaha,    setUsaha]    = useState(laporan.jumlah_usaha);
  const [kosong,   setKosong]   = useState(laporan.jumlah_bangunan_kosong);
  const [bangunan, setBangunan] = useState(laporan.total_bangunan);
  const [catatan,  setCatatan]  = useState(laporan.catatan || '');
  const [saving,   setSaving]   = useState(false);

  // Tutup dengan Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Cegah scroll body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await laporanApi.update(laporan._id, {
        jumlah_keluarga_non_usaha: kel,
        jumlah_usaha:              usaha,
        jumlah_bangunan_kosong:    kosong,
        total_bangunan:            bangunan,
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

  const isDirty =
    kel      !== laporan.jumlah_keluarga_non_usaha ||
    usaha    !== laporan.jumlah_usaha ||
    kosong   !== laporan.jumlah_bangunan_kosong ||
    bangunan !== laporan.total_bangunan ||
    catatan  !== (laporan.catatan || '');

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
            label="Keluarga Non-Usaha"
            value={kel} onChange={setKel}
            helpText="Keluarga tanpa usaha"
          />
          <NumberInput
            label="Usaha Berhasil Didata"
            value={usaha} onChange={setUsaha}
            helpText="Usaha dan keluarga yang memiliki usaha"
          />
          <NumberInput
            label="Bangunan Kosong"
            value={kosong} onChange={setKosong}
            helpText="Tempat ibadah, kantor, tidak berpenghuni"
          />
          <NumberInput
            label="Total Bangunan Sudah Stiker"
            value={bangunan} onChange={setBangunan}
            helpText="Bangunan yang sudah diberi stiker SE2026"
          />

          <div className="form-group">
            <div className="form-label">Catatan / Kendala</div>
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
