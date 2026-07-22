import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Newspaper, Send, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import BackButton from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'

export default function EnrichNewsPoolPage() {
  const [content, setContent] = useState('')
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const mutation = useMutation({
    mutationFn: (text) => actorApi.enrichNewsPool(text),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      setContent('')
      setTimeout(() => navigate('/'), 1000)
    },
  })

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (isOverLimit) return 'var(--color-danger, #ef4444)'
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'
    
    if (isRequired) {
      return (!value || !value.trim()) ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    mutation.mutate(content.trim())
  }

  const charCount = content.length
  const isOverLimit = charCount > 5000
  const canSubmit = content.trim() !== '' && !isOverLimit && !mutation.isPending

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Sparkles size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('news.enrich_news_title')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('news.enrich_news_desc')}
          </p>
        </div>
      </div>

      {/* Auth warning */}
      {!isLoggedIn && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            marginBottom: 24,
          }}
        >
          <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
              {t('auth.login_required')}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {t('news.login_to_enrich')}
              <span
                style={{
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => navigate('/login')}
              >
                {t('auth.you_must_login')}
              </span>
              .
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('news.content_label')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              id="enrich-news-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('news.content_placeholder')}
              disabled={!isLoggedIn || mutation.isPending}
              rows={10}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 200,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('content', content, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                opacity: !isLoggedIn ? 0.5 : 1,
              }}
              onFocus={() => setFocused('content')}
              onBlur={() => setFocused(null)}
            />
          </div>
          {/* Char count */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 6,
              fontSize: 12,
              color: isOverLimit
                ? 'var(--color-danger, #ef4444)'
                : 'var(--color-text-muted, var(--color-text-secondary))',
            }}
          >
            {charCount} / 5000
          </div>
        </div>


        {/* Submit button */}
        <button
          id="enrich-news-submit-btn"
          type="submit"
          disabled={!isLoggedIn || mutation.isPending}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '13px 24px',
            fontSize: 14,
            fontWeight: 600,
            gap: 8,
            borderRadius: 12,
            opacity: (!isLoggedIn || mutation.isPending) ? 0.5 : 1,
            cursor: (!isLoggedIn || mutation.isPending) ? 'not-allowed' : 'pointer',
          }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              {t('action.adding')}
            </>
          ) : (
            <>{t('action.enrich')}</>
          )}
        </button>
      </form>

      {/* Info card */}
      <div
        style={{
          marginTop: 32,
          padding: '16px 20px',
          borderRadius: 12,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Sparkles size={14} color="var(--color-primary)" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {t('news.how_it_works')}
          </span>
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
          <li>{t('news.how_it_works_1')}</li>
          <li>{t('news.how_it_works_2')}</li>
          <li>{t('news.how_it_works_3')}</li>
        </ul>
      </div>
    </div>
  )
}
