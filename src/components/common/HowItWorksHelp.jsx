import { useEffect, useId, useState } from 'react'
import { ShieldQuestion, X, Info } from 'lucide-react'
import IconActionButton from './IconActionButton'
import { useTranslation } from 'react-i18next'

export default function HowItWorksHelp({
  title,
  items,
  triggerLabel = title,
  closeLabel = null,
  triggerStyle,
  modalWidth = 'min(700px, calc(100vw - 32px))',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()
  const { t } = useTranslation()

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
          style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              maxHeight: '90vh',
              padding: 0,
              borderRadius: 16,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid var(--color-border-light)',
                background: 'rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary-alpha)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ShieldQuestion size={24} color="var(--color-primary)" />
                </div>
                <div>
                  <h2
                    id={titleId}
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsOpen(false)}
                aria-label={closeLabel || t('common.close', 'Kapat')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {items.map((item, index) => (
                  <div
                    key={`${titleId}-${index}`}
                    style={{
                      display: 'flex',
                      gap: 16,
                      padding: 20,
                      borderRadius: 12,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: 'var(--color-surface)',
                      border: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <Info size={16} color="var(--color-primary)" />
                    </div>
                    <div style={{ flex: 1, margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
