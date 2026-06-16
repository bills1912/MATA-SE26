import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

function Dropdown({ triggerRef, onClose, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const calc = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: r.width });
    };
    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    return () => {
      window.removeEventListener('resize', calc);
      window.removeEventListener('scroll', calc, true);
    };
  }, [triggerRef]);

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
    <div ref={ref} className="ss-portal-dropdown"
      style={{ top: pos.top, left: pos.left, width: pos.width }}>
      {children}
    </div>,
    document.body
  );
}

export default function SlsSelect({ label, value, onChange, options, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter(o => o.nmsubsls.toLowerCase().includes(query.toLowerCase()));
  const selectedOpt = options.find(o => o.idsubsls === value);

  const close = useCallback(() => { setOpen(false); setQuery(''); }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setQuery('');
  }, [open]);

  const handleSelect = (opt) => { onChange(opt.idsubsls); close(); };
  const handleClear = (e) => { e.stopPropagation(); onChange(''); close(); };

  return (
    <div className="ss-wrap">
      {label && <div className="ss-label">⬡ {label}</div>}

      <button
        ref={triggerRef}
        type="button"
        className={'ss-trigger' + (open ? ' ss-open' : '') + (disabled ? ' ss-disabled' : '')}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        disabled={disabled}
      >
        <div className="ss-value-block">
          <span className={'ss-value' + (selectedOpt ? '' : ' ss-placeholder')}>
            {selectedOpt ? selectedOpt.nmsubsls : '— Pilih SLS —'}
          </span>
          {selectedOpt && <span className="ss-sub-id">{selectedOpt.idsubsls}</span>}
        </div>
        <span className="ss-icons">
          {selectedOpt && !disabled && <span className="ss-clear" onClick={handleClear}>✕</span>}
          <span className={'ss-arrow' + (open ? ' ss-arrow-up' : '')}>›</span>
        </span>
      </button>

      {open && (
        <Dropdown triggerRef={triggerRef} onClose={close}>
          <div className="ss-search-wrap">
            <span className="ss-search-icon">🔍</span>
            <input ref={inputRef} className="ss-search" type="text" value={query}
              onChange={e => setQuery(e.target.value)} placeholder="Cari SLS / sub-SLS..." />
            {query && <button className="ss-search-clear" onClick={() => setQuery('')}>✕</button>}
          </div>
          <div className="ss-count">
            {filtered.length === options.length
              ? `${options.length} SLS tersedia`
              : `${filtered.length} dari ${options.length} hasil`}
          </div>
          <div className="ss-options">
            {filtered.length === 0
              ? <div className="ss-empty">Tidak ada SLS "{query}"</div>
              : filtered.map(opt => (
                <button key={opt.idsubsls} type="button"
                  className={'ss-option' + (opt.idsubsls === value ? ' ss-selected' : '')}
                  onClick={() => handleSelect(opt)}>
                  <span className="ss-check">{opt.idsubsls === value ? '✓' : ''}</span>
                  <div className="ss-opt-block">
                    <span className="ss-opt-text">{highlight(opt.nmsubsls, query)}</span>
                    <span className="ss-opt-id">{opt.idsubsls}</span>
                  </div>
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
