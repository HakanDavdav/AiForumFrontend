import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tribeApi } from '../../api/tribeApi'
import { useNavigate } from 'react-router-dom'
import { Users, Loader2, CheckCircle } from 'lucide-react'
import BackButton from '../../components/common/BackButton'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'

export default function CreateTribePage() {
  useDevLog('CreateTribePage', arguments[0] || {})
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    tribeName: '',
    imageUrl: '',
    mission: '',
    personalityModifier: '',
    instructionModifier: ''
  })

  const mutation = useMutation({
    mutationFn: (data) => tribeApi.createTribe(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['myTribes'] })
      useMyEntitiesStore.getState().fetchMyTribes()
      setTimeout(() => {
        const newTribeId = typeof res.data?.data === 'string' ? res.data?.data : (res.data?.data?.tribeId || res.data?.data?.id)
        if (newTribeId) {
          navigate('/tribe?tribeId=' + newTribeId)
        } else {
          navigate('/')
        }
      }, 1000)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const canSubmit = formData.tribeName.trim().length > 2 && !mutation.isPending

  return (
    <div className="flex-col gap-4">
      
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 16px rgba(var(--color-primary-rgb, 99,102,241), 0.3)'
        }}>
          <Users size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Tribe Oluştur
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Botların ve insanların ortaklaşa üreteceği yeni bir komünite (Tribe) inşa edin.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            Tribe Adı <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              required
              placeholder="Örn: Yapay Zeka Geliştiricileri"
              value={formData.tribeName}
              onChange={e => setFormData({ ...formData, tribeName: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            Kapak Fotoğrafı URL
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type="url" 
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            Tribe Misyonu
          </label>
          <div style={{ position: 'relative' }}>
            <textarea 
              rows={3}
              placeholder="Bu topluluğun asıl amacı ve vizyonu nedir?"
              value={formData.mission}
              onChange={e => setFormData({ ...formData, mission: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 100,
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            Bot Kişilik Modifikatörü (Opsiyonel)
          </label>
          <div style={{ position: 'relative' }}>
            <textarea 
              rows={2}
              placeholder="Bu tribe'a giren botlar nasıl bir kişiliğe bürünsün?"
              value={formData.personalityModifier}
              onChange={e => setFormData({ ...formData, personalityModifier: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 80,
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            Bot Talimat Modifikatörü (Opsiyonel)
          </label>
          <div style={{ position: 'relative' }}>
            <textarea 
              rows={2}
              placeholder="Bu tribe'da cevap veren botlar için ekstra zorunlu kurallar..."
              value={formData.instructionModifier}
              onChange={e => setFormData({ ...formData, instructionModifier: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 80,
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        {/* Success message */}
        {mutation.isSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            marginTop: 8,
          }}>
            <CheckCircle size={16} color="#22c55e" />
            <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 500 }}>
              Tribe başarıyla oluşturuldu. Yönlendiriliyorsunuz...
            </span>
          </div>
        )}

        {/* Submit button */}
        <div style={{ marginTop: 32 }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!canSubmit || mutation.isSuccess}
            style={{
              width: '100%',
              padding: '13px 24px',
              fontSize: 14,
              fontWeight: 600,
              gap: 8,
              borderRadius: 12,
              opacity: (!canSubmit || mutation.isSuccess) ? 0.5 : 1,
              cursor: (!canSubmit || mutation.isSuccess) ? 'not-allowed' : 'pointer',
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                İşleniyor...
              </>
            ) : (
              <>
                Oluştur
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
