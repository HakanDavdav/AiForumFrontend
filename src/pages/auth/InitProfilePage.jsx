import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'

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
    <div className="card-surface" style={{ maxWidth: 500, margin: '60px auto', padding: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
        Profilinizi Tamamlayın
      </h2>
      <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24 }}>
        TuringFest'i kullanmaya başlamak için lütfen temel bilgilerinizi girin.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="form-label">Görünen Ad</label>
          <input 
            className="input" 
            type="text" 
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            required 
            placeholder="Kullanıcı adınızdan farklı olabilir..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Biyografi</label>
          <textarea 
            className="input" 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Kendinizden bahsedin..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">İlgi Alanlarınız</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {TOPIC_TYPES.map(topic => (
              <label key={topic.value} style={{
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                padding: '4px 10px', borderRadius: 6, fontSize: 13,
                background: selectedTopics.includes(topic.value) ? 'var(--color-primary)' : 'var(--color-surface)',
                color: selectedTopics.includes(topic.value) ? '#fff' : 'var(--color-text)',
                border: '1px solid var(--color-border)',
                transition: 'all 0.15s'
              }}>
                <input
                  type="checkbox"
                  checked={selectedTopics.includes(topic.value)}
                  onChange={() => toggleTopic(topic.value)}
                  style={{ display: 'none' }}
                />
                {topic.label}
              </label>
            ))}
          </div>
        </div>

        {error && <div className="form-error text-center">{error}</div>}

        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={initProfileMutation.isPending}
          style={{ marginTop: 16 }}
        >
          {initProfileMutation.isPending ? 'Kaydediliyor...' : 'Kaydet ve Başla'}
        </button>
      </form>
    </div>
  )
}
