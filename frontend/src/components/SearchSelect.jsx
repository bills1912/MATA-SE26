import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

function Dropdown({ triggerRef, onClose, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  // Position dropdown below the trigger
  useEffect(() => {
    const calc = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
      });
    };
    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    return () => {
      window.removeEventListener('resize', calc);
      window.removeEventListener('scroll', calc, true);
    };
  }, [triggerRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, triggerRef]);

  return createPortal(
    <div
      ref={ref}
      className="ss-portal-dropdown"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      {children}
    </div>,
    document.body
  );
}

export default function SearchSelect({ label, placeholder, value, onChange, options, disabled, icon }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  const close = useCallback(() => { setOpen(false); setQuery(''); }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setQuery('');
  }, [open]);

  const handleSelect = (opt) => { onChange(opt); close(); };
  const handleClear = (e) => { e.stopPropagation(); onChange(''); close(); };

  return (
    <div className="ss-wrap">
      {label && (
        <div className="ss-label">
          {icon && <span>{icon}</span>}{label}
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={'ss-trigger' + (open ? ' ss-open' : '') + (disabled ? ' ss-disabled' : '')}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        disabled={disabled}
      >
        <span className={'ss-value' + (value ? '' : ' ss-placeholder')}>
          {value || placeholder || '— Pilih —'}
        </span>
        <span className="ss-icons">
          {value && !disabled && <span className="ss-clear" onClick={handleClear}>✕</span>}
          <span className={'ss-arrow' + (open ? ' ss-arrow-up' : '')}>›</span>
        </span>
      </button>

      {open && (
        <Dropdown triggerRef={triggerRef} onClose={close}>
          <div className="ss-search-wrap">
            <span className="ss-search-icon">🔍</span>
            <input ref={inputRef} className="ss-search" type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Cari ${label?.toLowerCase() || ''}...`} />
            {query && <button className="ss-search-clear" onClick={() => setQuery('')}>✕</button>}
          </div>
          <div className="ss-count">
            {filtered.length === options.length
              ? `${options.length} pilihan tersedia`
              : `${filtered.length} dari ${options.length} hasil`}
          </div>
          <div className="ss-options">
            {filtered.length === 0
              ? <div className="ss-empty">Tidak ada hasil untuk "{query}"</div>
              : filtered.map(opt => (
                <button key={opt} type="button"
                  className={'ss-option' + (opt === value ? ' ss-selected' : '')}
                  onClick={() => handleSelect(opt)}>
                  <span className="ss-check">{opt === value ? '✓' : ''}</span>
                  <span className="ss-opt-text">{highlight(opt, query)}</span>
                </button>
              ))}
          </div>
        </Dropdown>
      )}
    </div>
  );
}

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(99,102,241,0.35)', color: '#c7d2fe', borderRadius: 3, padding: '0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
