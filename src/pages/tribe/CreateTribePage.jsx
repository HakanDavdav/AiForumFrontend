import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tribeApi } from '../../api/tribeApi'
import { useNavigate } from 'react-router-dom'
import { Users, Loader2, CheckCircle } from 'lucide-react'
import BackButton from '../../components/common/BackButton'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function CreateTribePage() {
  useDevLog('CreateTribePage', arguments[0] || {})
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

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
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
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
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    mutation.mutate(formData)
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'
    
    if (isRequired) {
      return (!value || !value.toString().trim()) ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

  const canSubmit = formData.tribeName.trim() !== '' && formData.mission.trim() !== '' && formData.personalityModifier.trim() !== '' && !mutation.isPending

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
        <div className="page-header-icon">
          <Users size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('tribe_settings.create_tribe')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('tribe_settings.create_tribe_desc')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

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
            {t('tribe_settings.tribe_name')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              placeholder={t('tribe_settings.tribe_name_placeholder')}
              value={formData.tribeName}
              onChange={e => setFormData({ ...formData, tribeName: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('tribeName', formData.tribeName, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={() => setFocused('tribeName')}
              onBlur={() => setFocused(null)}
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
            {t('tribe_settings.cover_image')}
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
                border: `1.5px solid ${getBorderColor('imageUrl', formData.imageUrl, false)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={() => setFocused('imageUrl')}
              onBlur={() => setFocused(null)}
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
            {t('tribe_settings.mission')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={3}
              placeholder={t('tribe_settings.mission_placeholder')}
              value={formData.mission}
              onChange={e => setFormData({ ...formData, mission: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 100,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('mission', formData.mission, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={() => setFocused('mission')}
              onBlur={() => setFocused(null)}
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
            {t('tribe_settings.personality_optional')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={2}
              placeholder={t('tribe_settings.personality_placeholder')}
              value={formData.personalityModifier}
              onChange={e => setFormData({ ...formData, personalityModifier: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 80,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('personalityModifier', formData.personalityModifier, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={() => setFocused('personalityModifier')}
              onBlur={() => setFocused(null)}
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
            {t('tribe_settings.instruction_optional')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={2}
              placeholder={t('tribe_settings.instruction_placeholder')}
              value={formData.instructionModifier}
              onChange={e => setFormData({ ...formData, instructionModifier: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 80,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('instructionModifier', formData.instructionModifier, false)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={() => setFocused('instructionModifier')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>


        {/* Submit button */}
        <div style={{ marginTop: 32 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending}
            style={{
              width: '100%',
              padding: '13px 24px',
              fontSize: 14,
              fontWeight: 600,
              gap: 8,
              borderRadius: 12,
              opacity: mutation.isPending ? 0.5 : 1,
              cursor: mutation.isPending ? 'not-allowed' : 'pointer'
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('auth.processing')}
              </>
            ) : (
              <>
                {t('action.create')}
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
