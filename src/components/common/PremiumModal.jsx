import { useEffect, useId } from 'react'
import { X, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function PremiumModal({ isOpen, onClose }) {
  const titleId = useId()
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) return undefined
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      role="presentation"
    >
      <section
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, calc(100vw - 32px))',
          maxWidth: 'none',
          maxHeight: '90vh',
          padding: 0,
          borderRadius: 16,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
            background: 'rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--color-primary-alpha)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={24} color="var(--color-primary)" />
            </div>
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
              {t('premium.title', 'Premium')}
            </h2>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label={t('common.close', 'Kapat')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {t(
              'premium.placeholder_desc',
              'Premium avantajları yakında burada yer alacak. Premium ile ekstra bot slotları, kart sahiplik limiti bonusu ve daha fazlasını kazanabilirsiniz.'
            )}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 20, width: '100%' }}
            disabled
          >
            {t('premium.upgrade_soon', 'Yakında')}
          </button>
        </div>
      </section>
    </div>
  )
}
