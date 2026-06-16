export default function NumberInput({ label, value, onChange, helpText }) {
  const inc = () => onChange(Math.max(0, (parseInt(value) || 0) + 1));
  const dec = () => onChange(Math.max(0, (parseInt(value) || 0) - 1));
  const handleChange = e => {
    const v = parseInt(e.target.value);
    onChange(isNaN(v) ? 0 : Math.max(0, v));
  };
  return (
    <div className="number-field">
      <div className="number-label">{label}</div>
      {helpText && <div className="number-help">{helpText}</div>}
      <div className="number-row">
        <button type="button" className="num-btn" onClick={dec}>−</button>
        <div className="num-divider" />
        <input
          type="number" className="num-val"
          value={value} onChange={handleChange}
          min="0" inputMode="numeric" pattern="[0-9]*"
        />
        <div className="num-divider" />
        <button type="button" className="num-btn" onClick={inc}>+</button>
      </div>
    </div>
  );
}
