import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../../api/actorApi'
import useAuthStore from '../../../store/authStore'
import useUIStore from '../../../store/uiStore'

export default function InitProfilePage() {
  const { actorId, setProfileCreated } = useAuthStore()
  const { setCenterView } = useUIStore()
  const queryClient = useQueryClient()

  const [profileName, setProfileName] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState(null)

  const initProfileMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    onSuccess: () => {
      // Başarılı olunca authStore'da isProfileCreated'ı güncelle ve feed'e at
      setProfileCreated(true)
      queryClient.invalidateQueries()
      setCenterView('feed')
    },
    onError: (err) => {
      setError(err.message || 'Profil oluşturulurken bir hata oluştu.')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    
    // CreateEditUserProfileDto beklentilerine uygun payload
    const payload = {
      userId: actorId,
      profileName: profileName,
      bio: bio,
      imageUrl: '',
      topicTypes: [0], // Varsayılan bir konu (enum değeri örn: Software)
      theme: 0, // Light
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
        AiForum'u kullanmaya başlamak için lütfen temel bilgilerinizi girin.
      </p>

      <form onSubmit={handleSubmit} className="flex-col gap-4">
        <div className="form-group">
          <label className="form-label">Görünen Ad (Profile Name)</label>
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
          <label className="form-label">Kısa Biyografi (Bio)</label>
          <textarea 
            className="input" 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Kendinizden bahsedin..."
          />
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
