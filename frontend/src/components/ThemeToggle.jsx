import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../utils/ThemeContext';

const OPTIONS = [
  { id: 'dark',   icon: '🌙', label: 'Gelap',  sub: 'Dark mode' },
  { id: 'light',  icon: '☀️', label: 'Terang', sub: 'Light mode' },
  { id: 'system', icon: '💻', label: 'Sistem',  sub: 'Ikuti OS'  },
];

const GAP = 8;

function ThemeMenu({ triggerRef, onClose }) {
  const { theme, setTheme } = useTheme();
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null); // null = belum dihitung

  const calcPos = () => {
    if (!triggerRef.current || !menuRef.current) return;
    const tr   = triggerRef.current.getBoundingClientRect();
    const popH = menuRef.current.offsetHeight;
    const popW = menuRef.current.offsetWidth || 210;
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;

    const spaceBelow = vh - tr.bottom;
    const spaceAbove = tr.top;

    const top = (spaceBelow >= popH + GAP || spaceBelow >= spaceAbove)
      ? tr.bottom + window.scrollY + GAP
      : tr.top    + window.scrollY - popH - GAP;

    let left = tr.right - popW + window.scrollX;
    if (left < 8)             left = 8;
    if (left + popW > vw - 8) left = vw - popW - 8;

    setPos({ top, left, width: popW });
  };

  // Hitung SEKALI setelah menu muncul di DOM — pakai rAF agar dimensi sudah tersedia
  useEffect(() => {
    const id = requestAnimationFrame(calcPos);
    return () => cancelAnimationFrame(id);
  }, []); // intentionally empty — only on mount

  // Update posisi saat resize / scroll
  useEffect(() => {
    window.addEventListener('resize',  calcPos);
    window.addEventListener('scroll',  calcPos, true);
    return () => {
      window.removeEventListener('resize',  calcPos);
      window.removeEventListener('scroll',  calcPos, true);
    };
  }, []);

  // Tutup saat klik di luar
  useEffect(() => {
    const h = (e) => {
      if (
        menuRef.current    && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose, triggerRef]);

  const style = pos
    ? { position: 'absolute', ...pos }
    : { position: 'absolute', visibility: 'hidden', top: 0, left: 0 };

  return createPortal(
    <div ref={menuRef} className="theme-menu" style={style}>
      <div className="theme-menu-title">Tema Tampilan</div>
      {OPTIONS.map(opt => (
        <button
          key={opt.id}
          type="button"
          className={'theme-opt' + (theme === opt.id ? ' theme-opt-active' : '')}
          onClick={() => { setTheme(opt.id); onClose(); }}
        >
          <span className="theme-opt-icon">{opt.icon}</span>
          <div className="theme-opt-text">
            <span className="theme-opt-label">{opt.label}</span>
            <span className="theme-opt-sub">{opt.sub}</span>
          </div>
          {theme === opt.id && <span className="theme-opt-check">✓</span>}
        </button>
      ))}
    </div>,
    document.body
  );
}

export default function ThemeToggle() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const cur = OPTIONS.find(o => o.id === theme);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={'theme-toggle' + (open ? ' theme-toggle-open' : '')}
        onClick={() => setOpen(o => !o)}
        title="Ganti tema"
      >
        <span>{cur?.icon}</span>
        <span className="theme-toggle-label">{cur?.label}</span>
        <span className="theme-toggle-arrow">›</span>
      </button>
      {open && <ThemeMenu triggerRef={triggerRef} onClose={() => setOpen(false)} />}
    </>
  );
}
