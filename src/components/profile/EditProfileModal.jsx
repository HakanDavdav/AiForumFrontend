import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'

export default function EditProfileModal({ isOpen, onClose }) {
  useDevLog('EditProfileModal', arguments[0] || {})
  const { actorId } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    profileName: '',
    imageUrl: '',
    bio: ''
  })

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
    }
  }, [profileResponse])

  const editUserMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
      onClose()
    }
  })

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 500, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Profili Düzenle</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '0 8px' }}>✕</button>
        </div>

        {isLoadingProfile ? (
          <div className="text-center text-muted">Yükleniyor...</div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); editUserMutation.mutate(formData); }} className="flex-col gap-4">
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
