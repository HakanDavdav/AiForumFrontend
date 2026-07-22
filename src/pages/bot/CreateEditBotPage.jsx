import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import { Trash2, Loader2, Bot, Brain, CheckCircle, Edit3 } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
import { TopicTypes, BotModes } from '../../constants/TopicTypes'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function CreateEditBotPage() {
  useDevLog('CreateEditBotPage', arguments[0] || {})
  const [searchParams] = useSearchParams()
  const botId = searchParams.get('botId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  // If botId is provided, we are in Edit mode
  const isEditMode = Boolean(botId)

  const [formData, setFormData] = useState({
    profileName: '',
    imageUrl: '',
    bio: '',
    botPersonality: '',
    instructions: '',
    autoInterests: false,
    autoBio: false,
    topicTypes: [],
    botMode: 0
  })

  // Fetch existing data if in Edit Mode
  const { data: existingBot, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['actorProfile', botId],
    queryFn: () => actorApi.getProfile(botId).then(res => res.data?.data),
    enabled: isEditMode
  })

  useEffect(() => {
    if (isEditMode && existingBot) {
      setFormData({
        profileName: existingBot.profileName || '',
        imageUrl: existingBot.imageUrl || '',
        bio: existingBot.bio || '',
        botPersonality: existingBot.botSettings?.botPersonality || '',
        instructions: existingBot.botSettings?.instructions || '',
        autoInterests: existingBot.botSettings?.autoInterests || false,
        autoBio: existingBot.botSettings?.autoBio || false,
        topicTypes: existingBot.botSettings?.topicTypes || [],
        botMode: existingBot.botSettings?.botMode ?? 0
      })
    }
  }, [isEditMode, existingBot])

  const mutation = useMutation({
    mutationFn: (data) => isEditMode ? actorApi.editBot(botId, data) : actorApi.createBot(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myBots'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      useMyEntitiesStore.getState().fetchMyBots()

      setTimeout(() => {
        const newBotId = isEditMode ? botId : (typeof res.data?.data === 'string' ? res.data?.data : res.data?.data?.actorId)
        if (newBotId) {
          navigate('/profile?actorId=' + newBotId)
        } else {
          navigate('/')
        }
      }, 1000)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => actorApi.deleteBot(botId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myBots'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      useMyEntitiesStore.getState().fetchMyBots()
      navigate('/')
    }
  })

  const handleDeleteBot = () => {
    if (window.confirm(t('bot.confirm_delete'))) {
      deleteMutation.mutate()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }

    const payload = { ...formData }
    if (payload.autoBio) {
      payload.bio = ''
    }
    if (payload.autoInterests) {
      payload.topicTypes = []
    }

    mutation.mutate(payload)
  }

  const handleTopicToggle = (value) => {
    setFormData(prev => {
      const exists = prev.topicTypes.includes(value)
      if (exists) {
        return { ...prev, topicTypes: prev.topicTypes.filter(t => t !== value) }
      } else {
        return { ...prev, topicTypes: [...prev.topicTypes, value] }
      }
    })
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

  const canSubmit = formData.profileName.trim() !== '' &&
    formData.botPersonality.trim() !== '' &&
    formData.instructions.trim() !== '' &&
    (formData.autoBio || formData.bio.trim() !== '') &&
    !mutation.isPending

  if (isEditMode && isLoadingExisting) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    )
  }

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
          {isEditMode ? <Brain size={22} color="#fff" /> : <Bot size={22} color="#fff" />}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {isEditMode ? t('bot.bot_settings') : t('bot.create_bot')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {isEditMode ? t('bot.edit_bot_desc') : t('bot.create_bot_desc')}
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
            {t('bot.bot_name')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              placeholder={t('bot.bot_name_placeholder')}
              value={formData.profileName}
              onChange={e => setFormData({ ...formData, profileName: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('profileName', formData.profileName, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={() => setFocused('profileName')}
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
            {t('bot.profile_image')}
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
            {t('bot.bot_mode')}
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={formData.botMode}
              onChange={e => setFormData({ ...formData, botMode: parseInt(e.target.value) })}
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
                boxSizing: 'border-box',
                appearance: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            >
              {BotModes.map(mode => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
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
            {t('bot.bot_personality')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={3}
              placeholder={t('bot.bot_personality_placeholder')}
              value={formData.botPersonality}
              onChange={e => setFormData({ ...formData, botPersonality: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 100,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('botPersonality', formData.botPersonality, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={() => setFocused('botPersonality')}
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
            {t('bot.special_instructions')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={3}
              placeholder={t('bot.special_instructions_placeholder')}
              value={formData.instructions}
              onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 100,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('instructions', formData.instructions, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={() => setFocused('instructions')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        {!formData.autoBio && (
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
              {t('bot.bio')}
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                rows={2}
                placeholder={t('bot.bio_placeholder')}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                disabled={mutation.isPending || mutation.isSuccess}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  minHeight: 80,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `1.5px solid ${getBorderColor('bio', formData.bio, !formData.autoBio)}`,
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: 14,
                  lineHeight: 1.65,
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={() => setFocused('bio')}
                onBlur={() => setFocused(null)}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={formData.autoBio}
              onChange={e => setFormData({ ...formData, autoBio: e.target.checked })}
              disabled={mutation.isPending || mutation.isSuccess}
            />
            {t('bot.auto_bio')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={formData.autoInterests}
              onChange={e => setFormData({ ...formData, autoInterests: e.target.checked })}
              disabled={mutation.isPending || mutation.isSuccess}
            />
            {t('bot.auto_interests')}
          </label>
        </div>

        {!formData.autoInterests && (
          <div>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 10,
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              {t('bot.interests')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TopicTypes.map(topic => {
                const isSelected = formData.topicTypes.includes(topic.value)
                return (
                  <div
                    key={topic.value}
                    onClick={() => {
                      if (!mutation.isPending && !mutation.isSuccess) {
                        handleTopicToggle(topic.value)
                      }
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: (mutation.isPending || mutation.isSuccess) ? 'default' : 'pointer',
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-raised, var(--color-surface))',
                      color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 2px 8px rgba(var(--color-primary-rgb, 99,102,241), 0.25)' : 'none'
                    }}
                  >
                    {topic.label}
                  </div>
                )
              })}
            </div>
          </div>
        )}


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
                {isEditMode ? t('action.update') : t('action.generate')}
              </>
            )}
          </button>
        </div>

      </form>

      {/* Delete button section */}
      {isEditMode && (
        <div style={{
          marginTop: 48,
          padding: '20px',
          borderRadius: 12,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.04)'
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', margin: '0 0 8px 0' }}>{t('tribe_settings.danger_zone')}</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            {t('bot.danger_zone_desc')}
          </p>
          <button
            className="btn btn-primary"
            style={{ background: '#ef4444', borderColor: '#ef4444', width: '100%', gap: 8 }}
            onClick={handleDeleteBot}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} /> {t('bot.delete_bot')}
          </button>
        </div>
      )}

    </div>
  )
}
