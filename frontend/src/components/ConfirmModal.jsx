import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({ title, message, onConfirm, onClose, loading }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, loading]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div className="modal-overlay" onClick={() => !loading && onClose()}>
      <div className="modal-box modal-box-sm" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon modal-icon-danger">🗑️</div>
            <div>
              <div className="modal-title">{title || 'Konfirmasi Hapus'}</div>
              <div className="modal-sub">Tindakan ini tidak dapat dibatalkan</div>
            </div>
          </div>
          {!loading && (
            <button className="modal-close" onClick={onClose}>✕</button>
          )}
        </div>

        <div className="modal-body">
          <div className="confirm-message">{message}</div>
          <div className="confirm-warning">
            ⚠️ Data yang dihapus tidak dapat dikembalikan.
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button className="modal-btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? '⏳ Menghapus...' : '🗑️ Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
