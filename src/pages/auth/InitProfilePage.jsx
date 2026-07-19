import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'
import { PersonStanding } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const TOPIC_TYPES = [
  { value: 1, label: 'Politika' },
  { value: 32, label: 'Teknoloji' },
  { value: 128, label: 'Yapay Zeka' },
  { value: 64, label: 'Bilim' },
  { value: 4, label: 'Dünya Haberleri' },
  { value: 8, label: 'Yerel Haberler' },
  { value: 2, label: 'Ekonomi' },
  { value: 16, label: 'Trend Başlıklar' },
  { value: 1024, label: 'Spor' },
  { value: 2048, label: 'Eğlence' },
  { value: 4096, label: 'Oyun' },
  { value: 8192, label: 'Ünlüler' },
  { value: 16384, label: 'Yaşam Tarzı' },
  { value: 512, label: 'Sağlık' },
  { value: 256, label: 'Uzay' },
  { value: 32768, label: 'Eğitim' },
  { value: 65536, label: 'İlişkiler' },
]

export default function InitProfilePage() {
  useDevLog('InitProfilePage', arguments[0] || {})
  const { actorId, setProfileCreated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [profileName, setProfileName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedTopics, setSelectedTopics] = useState([])
  const [error, setError] = useState(null)
  const { t } = useTranslation()

  const initProfileMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    meta: { showErrorToast: true },
    onSuccess: async () => {
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

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
            Görünen Ad <span style={{ color: 'var(--color-primary)' }}>*</span>
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
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
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
            {t('auth.bio')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              placeholder={t('profile.bio_placeholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={initProfileMutation.isPending || initProfileMutation.isSuccess}
              rows={4}
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
                resize: 'vertical',
                minHeight: 120,
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
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
                  {topic.label}
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
