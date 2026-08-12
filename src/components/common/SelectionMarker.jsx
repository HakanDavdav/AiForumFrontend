import { Check } from 'lucide-react'

export default function SelectionMarker({
  checked = false,
  onChange,
  disabled = false,
  label,
  children,
  size = 'md',
  locked = false,
}) {
  const marker = (
    <span
      className={`selection-marker selection-marker--${size}${checked ? ' is-checked' : ''}${disabled ? ' is-disabled' : ''}${locked ? ' is-locked' : ''}`}
      aria-hidden="true"
    >
      {checked && <Check size={size === 'sm' ? 12 : 13} strokeWidth={3} />}
      {locked && <span className="selection-marker__slash" aria-hidden="true" />}
    </span>
  )

  if (typeof onChange !== 'function') {
    return (
      <span
        className="selection-marker-display"
        role={label ? 'img' : undefined}
        aria-label={label}
      >
        {marker}
      </span>
    )
  }

  return (
    <label className={`selection-control${disabled ? ' is-disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
      {marker}
      {children && <span className="selection-control__label">{children}</span>}
    </label>
  )
}
