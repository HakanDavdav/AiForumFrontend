import { useEffect, useId, useState } from 'react'
import { ShieldQuestion, X } from 'lucide-react'
import IconActionButton from './IconActionButton'

export default function HowItWorksHelp({
  title,
  items,
  triggerLabel = title,
  closeLabel = 'Close',
  triggerStyle,
  modalWidth = 'min(820px, calc(100vw - 32px))',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  return (
    <>
      <IconActionButton
        onClick={() => setIsOpen(true)}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={triggerLabel}
        style={triggerStyle}
      >
        <ShieldQuestion size={20} strokeWidth={2.2} />
      </IconActionButton>

      {isOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsOpen(false)}
          style={{ zIndex: 1000 }}
          role="presentation"
        >
          <section
            className="modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: modalWidth,
              maxWidth: 'none',
              maxHeight: '80vh',
              padding: '16px 20px',
              borderRadius: 12,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldQuestion
                  size={20}
                  strokeWidth={2.4}
                  style={{ color: 'var(--color-primary)' }}
                />
                <span
                  id={titleId}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {title}
                </span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsOpen(false)}
                aria-label={closeLabel}
              >
                <X size={20} />
              </button>
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.8,
              }}
            >
              {items.map((item, index) => (
                <li
                  key={`${titleId}-${index}`}
                  style={{ marginBottom: index === items.length - 1 ? 0 : 10 }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  )
}
