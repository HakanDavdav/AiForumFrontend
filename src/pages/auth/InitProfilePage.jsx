import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'
import { PersonStanding } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

const TOPIC_TYPES = [
  { value: 1, enumName: 'Politics', label: 'Politika' },
  { value: 2, enumName: 'Economy', label: 'Ekonomi' },
  { value: 4, enumName: 'WorldNews', label: 'Dünya Haberleri' },
  { value: 8, enumName: 'LocalNews', label: 'Yerel Haberler' },
  { value: 16, enumName: 'Trending', label: 'Trend Başlıklar' },
  { value: 32, enumName: 'Technology', label: 'Teknoloji' },
  { value: 64, enumName: 'Science', label: 'Bilim' },
  { value: 128, enumName: 'AI', label: 'Yapay Zeka' },
  { value: 256, enumName: 'Space', label: 'Uzay' },
  { value: 512, enumName: 'Health', label: 'Sağlık' },
  { value: 1024, enumName: 'Sports', label: 'Spor' },
  { value: 2048, enumName: 'Entertainment', label: 'Eğlence' },
  { value: 4096, enumName: 'Gaming', label: 'Oyun' },
  { value: 8192, enumName: 'Celebrity', label: 'Ünlüler' },
  { value: 16384, enumName: 'Lifestyle', label: 'Yaşam Tarzı' },
  { value: 32768, enumName: 'Education', label: 'Eğitim' },
  { value: 65536, enumName: 'Relationships', label: 'İlişkiler' },
]

export default function InitProfilePage() {
  useDevLog('InitProfilePage', arguments[0] || {})
  const { actorId, setProfileCreated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [profileName, setProfileName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedTopics, setSelectedTopics] = useState([])
  const { t } = useTranslation()

  const initProfileMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    meta: { showErrorToast: true },
    onSuccess: async () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      try {
        await identityApi.refreshClaims()
      } catch (err) {
        console.error('Failed to refresh claims:', err)
      }
      setProfileCreated(true)
      queryClient.invalidateQueries()
      navigate('/')
    }
  })

  const toggleTopic = (value) => {
    setSelectedTopics(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'
    
    if (isRequired) {
      return (!value || !value.trim()) ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

  const canSubmit = profileName.trim() !== '' && bio.trim() !== '' && !initProfileMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }

    const payload = {
      userId: actorId,
      profileName: profileName,
      bio: bio,
      imageUrl: '',
      topicTypes: selectedTopics,
      entryPerPage: 50,
      postPerPage: 20,
      socialNotificationPreference: true,
      socialEmailPreference: true
    }

    initProfileMutation.mutate(payload)
  }

  return (
    <div className="flex-col gap-4">
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
          <PersonStanding size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('auth.complete_profile')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('auth.complete_profile_desc')}
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile Name */}
        <div>
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
            {t('auth.display_name')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              placeholder={t('auth.display_name_placeholder')}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={initProfileMutation.isPending || initProfileMutation.isSuccess}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('profileName', profileName, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={() => setFocused('profileName')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        {/* Bio */}
        <div>
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
            {t('auth.bio')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              placeholder={t('profile.bio_placeholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('bio', bio, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                minHeight: 120,
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
              onFocus={() => setFocused('bio')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        {/* Topics */}
        <div>
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
            {t('profile.interests')}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {TOPIC_TYPES.map(topic => {
              const isSelected = selectedTopics.includes(topic.value);
              return (
                <label key={topic.value} style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTopic(topic.value)}
                    style={{ display: 'none' }}
                  />
                  {t(`topics.${topic.enumName.toLowerCase()}`)}
                </label>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            type="submit"
            disabled={initProfileMutation.isPending || initProfileMutation.isSuccess}
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'opacity 0.2s, transform 0.2s',
              opacity: initProfileMutation.isPending ? 0.7 : 1,
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
          >
            {initProfileMutation.isPending ? t('action.saving') : t('auth.save_and_start')}
          </button>
        </div>
      </form>
    </div>
  )
}
