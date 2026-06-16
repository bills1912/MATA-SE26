import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
dayjs.locale('id');

export function formatTanggal(dateStr) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('dddd, D MMMM YYYY');
}
export function todayStr() {
  return dayjs().format('YYYY-MM-DD');
}

const HARI  = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function CalendarPopup({ triggerRef, value, onChange, onClose, max }) {
  const ref    = useRef(null);
  const today  = dayjs();
  const maxDay = max ? dayjs(max) : today;

  const selected = value ? dayjs(value) : null;
  const [view, setView] = useState(selected || today); // bulan yang ditampilkan

  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const calc = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const popH = 340;
      const spaceBelow = window.innerHeight - r.bottom;
      const top = spaceBelow >= popH
        ? r.bottom + window.scrollY + 6
        : r.top + window.scrollY - popH - 6;
      setPos({ top, left: r.left + window.scrollX, width: Math.max(r.width, 300) });
    };
    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    return () => { window.removeEventListener('resize', calc); window.removeEventListener('scroll', calc, true); };
  }, [triggerRef]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, triggerRef]);

  const prevMonth = () => setView(v => v.subtract(1, 'month'));
  const nextMonth = () => {
    const next = view.add(1, 'month');
    if (next.isAfter(maxDay, 'month')) return;
    setView(next);
  };

  // Build calendar days grid
  const firstDay = view.startOf('month').day(); // 0=Sun
  const daysInMonth = view.daysInMonth();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleDay = (d) => {
    if (!d) return;
    const date = view.date(d);
    if (date.isAfter(maxDay, 'day')) return;
    onChange(date.format('YYYY-MM-DD'));
    onClose();
  };

  const isSelected = (d) => selected && selected.year() === view.year() && selected.month() === view.month() && selected.date() === d;
  const isToday    = (d) => today.year() === view.year() && today.month() === view.month() && today.date() === d;
  const isFuture   = (d) => d && view.date(d).isAfter(maxDay, 'day');
  const canNext    = !view.add(1,'month').startOf('month').isAfter(maxDay, 'month');

  return createPortal(
    <div ref={ref} className="cal-popup" style={{ top: pos.top, left: pos.left, width: pos.width }}>
      {/* Header bulan */}
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={prevMonth}>‹</button>
        <div className="cal-month-label">
          {BULAN[view.month()]} {view.year()}
        </div>
        <button type="button" className="cal-nav" onClick={nextMonth} disabled={!canNext}>›</button>
      </div>

      {/* Nama hari */}
      <div className="cal-weekdays">
        {HARI.map(h => <div key={h} className="cal-wd">{h}</div>)}
      </div>

      {/* Grid tanggal */}
      <div className="cal-grid">
        {cells.map((d, i) => (
          <button
            key={i}
            type="button"
            className={
              'cal-day' +
              (d === null ? ' cal-empty' : '') +
              (isSelected(d) ? ' cal-selected' : '') +
              (isToday(d) && !isSelected(d) ? ' cal-today' : '') +
              (isFuture(d) ? ' cal-disabled' : '')
            }
            onClick={() => handleDay(d)}
            disabled={!d || isFuture(d)}
          >
            {d || ''}
          </button>
        ))}
      </div>

      {/* Footer shortcut */}
      <div className="cal-footer">
        <button type="button" className="cal-today-btn" onClick={() => { onChange(today.format('YYYY-MM-DD')); onClose(); }}>
          Hari Ini
        </button>
        {value && (
          <button type="button" className="cal-clear-btn" onClick={() => { onChange(''); onClose(); }}>
            Hapus
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function DateInput({ value, onChange, label, placeholder }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="di-wrap">
      {label && <div className="form-label">{label}</div>}

      <button
        ref={triggerRef}
        type="button"
        className={'di-trigger' + (open ? ' di-open' : '')}
        onClick={() => setOpen(o => !o)}
      >
        <span className="di-icon">📅</span>
        <span className={'di-value' + (!value ? ' di-placeholder' : '')}>
          {value ? formatTanggal(value) : (placeholder || '— Pilih Tanggal —')}
        </span>
        <span className={'di-arrow' + (open ? ' di-arrow-up' : '')}>›</span>
      </button>

      {open && (
        <CalendarPopup
          triggerRef={triggerRef}
          value={value}
          onChange={onChange}
          onClose={close}
          max={todayStr()}
        />
      )}
    </div>
  );
}
