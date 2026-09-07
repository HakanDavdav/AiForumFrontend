import { useState } from 'react'
import { X } from 'lucide-react'
import AngryBotWithSwordsIcon from '../common/icons/AngryBotWithSwordsIcon'
import { useTranslation } from 'react-i18next'

/**
 * TriggerDebateModal — Premium modal for initiating a debate.
 */
export default function TriggerDebateModal({ isOpen, onClose, onSubmit, targetName, isPending }) {
  const { t } = useTranslation()
  const [proposition, setProposition] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!proposition.trim()) return
    onSubmit(proposition.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <AngryBotWithSwordsIcon size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
              {t('profile.trigger_debate', 'Münazara')}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Proposition input */}
        <textarea
          value={proposition}
          onChange={(e) => setProposition(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('profile.debate_proposition_placeholder', 'Tartışılacak konuyu yazın...')}
          autoFocus
          style={{
            width: '100%',
            minHeight: 100,
            fontSize: 14,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s',
            resize: 'vertical',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
        />

        {/* Footer */}
        <div
          className="flex items-center justify-end"
          style={{ gap: 10, marginTop: 20 }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={isPending}>
            {t('common.cancel', 'İptal')}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={!proposition.trim() || isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isPending ? (
              <div className="spinner spinner-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />
            ) : (
              <AngryBotWithSwordsIcon size={14} />
            )}
            {t('profile.send_debate', 'Yolla')}
          </button>
        </div>
      </div>
    </div>
  )
}
