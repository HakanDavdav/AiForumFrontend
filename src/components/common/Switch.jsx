import React from 'react'

export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  id,
  size = 'md',
  style = {},
  className = '',
}) {
  const isSm = size === 'sm'
  const isLg = size === 'lg'

  const width = isSm ? 36 : isLg ? 52 : 44
  const height = isSm ? 20 : isLg ? 28 : 24
  const thumbSize = isSm ? 14 : isLg ? 22 : 18
  const offset = 3

  const handleToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && onChange) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onChange) {
      e.preventDefault()
      onChange(!checked)
    }
  }

  return (
    <div
      className={`switch-container ${className}`}
      style={{
        display: 'flex',
        alignItems: description ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 16,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      onClick={handleToggle}
    >
      {(label || description) && (
        <div style={{ flex: 1, userSelect: 'none' }}>
          {label && (
            <div
              style={{
                fontSize: isSm ? 13 : 14,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: description ? 2 : 0,
              }}
            >
              {label}
            </div>
          )}
          {description && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.4,
              }}
            >
              {description}
            </div>
          )}
        </div>
      )}

      <div
        id={id}
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
          transition: 'background-color 0.25s ease',
          flexShrink: 0,
          outline: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: (height - thumbSize) / 2,
            left: checked ? width - thumbSize - offset : offset,
            width: thumbSize,
            height: thumbSize,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}
