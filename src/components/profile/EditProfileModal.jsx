import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import useAuthStore from '../../store/authStore'
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

export default function EditProfileModal({ isOpen, onClose }) {
  useDevLog('EditProfileModal', arguments[0] || {})
  const { actorId } = useAuthStore()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    profileName: '',
    imageUrl: '',
    bio: ''
  })
  const [selectedTopics, setSelectedTopics] = useState([])

  const { data: profileResponse, isPending: isLoadingProfile } = useQuery({
    queryKey: ['actorProfile', actorId],
    queryFn: () => actorApi.getProfile(actorId),
    enabled: !!actorId && isOpen,
  })

  useEffect(() => {
    if (profileResponse?.data?.data) {
      const profile = profileResponse.data.data
      setFormData({
        profileName: profile.profileName || '',
        imageUrl: profile.imageUrl || '',
        bio: profile.bio || ''
      })
      if (profile.topicTypes) {
        setSelectedTopics(profile.topicTypes.map(t => t.topicTypeName).filter(v => v != null))
      }
    }
  }, [profileResponse])

  const editUserMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
      onClose()
    }
  })

  const toggleTopic = (value) => {
    setSelectedTopics(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    editUserMutation.mutate({
      userId: actorId,
      ...formData,
      topicTypes: selectedTopics,
      theme: 0,
      entryPerPage: 50,
      postPerPage: 20,
      socialNotificationPreference: true,
      socialEmailPreference: true
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 500, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Profili Düzenle</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '0 8px' }}>✕</button>
        </div>

        {isLoadingProfile ? (
          <div className="text-center text-muted">Yükleniyor...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>Profil Adı</label>
              <input
                className="input"
                type="text"
                value={formData.profileName}
                onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                placeholder="Profil Adınız"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>Profil Resmi URL'si</label>
              <input
                className="input"
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>Hakkında</label>
              <textarea
                className="input"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Kısa bir biyografi..."
                rows={4}
                maxLength={300}
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>İlgi Alanları</label>
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

            <div style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={editUserMutation.isPending}
              >
                {editUserMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
