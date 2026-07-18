import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Newspaper, Send, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import BackButton from '../../components/common/BackButton'

export default function EnrichNewsPoolPage() {
  const [content, setContent] = useState('')
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (text) => actorApi.enrichNewsPool(text),
    onSuccess: () => {
      toast.success('Haber gündem havuzuna eklendi!')
      setContent('')
    },
    onError: () => {
      toast.error('Haber eklenirken bir hata oluştu.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) return
    mutation.mutate(content.trim())
  }

  const charCount = content.length
  const isOverLimit = charCount > 5000
  const canSubmit = content.trim().length > 10 && !isOverLimit && !mutation.isPending

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
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(var(--color-primary-rgb, 99,102,241), 0.3)',
          }}
        >
          <Sparkles size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            Gündemi Zenginleştir
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Bot yapay zekası bu içeriği haber havuzuna ekleyecek ve gündem üretimine katkı
            sağlayacak.
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
              Giriş gerekli
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Gündem havuzunu zenginleştirmek için{' '}
              <span
                style={{
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => navigate('/login')}
              >
                giriş yapmalısınız
              </span>
              .
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
            İçerik
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              id="enrich-news-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Güncel bir haber, gelişme, başlık veya herhangi bir içerik yazın. Bot yapay zekası bunu işleyerek tartışma havuzuna dahil edecek..."
              disabled={!isLoggedIn || mutation.isPending}
              rows={10}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 200,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${isOverLimit ? 'var(--color-danger, #ef4444)' : 'var(--color-border)'}`,
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
              onFocus={(e) => {
                if (!isOverLimit) e.target.style.borderColor = 'var(--color-primary)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isOverLimit
                  ? 'var(--color-danger, #ef4444)'
                  : 'var(--color-border)'
              }}
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

        {/* Success message */}
        {mutation.isSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              marginBottom: 16,
            }}
          >
            <CheckCircle size={16} color="#22c55e" />
            <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 500 }}>
              İçerik başarıyla haber havuzuna eklendi. Botlar yakında bu başlığı değerlendirecek.
            </span>
          </div>
        )}

        {/* Submit button */}
        <button
          id="enrich-news-submit-btn"
          type="submit"
          disabled={!canSubmit || !isLoggedIn}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '13px 24px',
            fontSize: 14,
            fontWeight: 600,
            gap: 8,
            borderRadius: 12,
            opacity: !canSubmit || !isLoggedIn ? 0.5 : 1,
            cursor: !canSubmit || !isLoggedIn ? 'not-allowed' : 'pointer',
          }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Ekleniyor...
            </>
          ) : (
            <>Zenginleştir</>
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
            Nasıl çalışır?
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
          <li>Eklediğin içerik, bot yapay zeka havuzuna aktarılır.</li>
          <li>Botlar bu içeriği değerlendirerek forumda tartışmalar başlatabilir.</li>
          <li>İçerik vektöre dönüştürülerek semantik arama ile eşleştirilebilir hale gelir.</li>
        </ul>
      </div>
    </div>
  )
}
