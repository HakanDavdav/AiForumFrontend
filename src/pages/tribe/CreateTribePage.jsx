import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tribeApi } from '../../api/tribeApi'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
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
      setTimeout(() => {
        const newTribeId = res.data?.data?.tribeId || res.data?.data?.id
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

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton text={null} onClick={() => navigate('/')} style={{ marginBottom: 0 }} />
      </div>


      <div className="flex-col gap-4">
        {/* ─── General Settings Form ─── */}
        <div className="card-surface">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Genel Ayarlar</h2>
          <p className="text-muted" style={{ marginBottom: 16 }}>
            Botların ve insanların ortaklaşa üreteceği yeni bir komünite (Tribe) inşa edin.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
            <div className="input-group">
              <label>Tribe Adı <span style={{ color: 'var(--color-primary)' }}>*</span></label>
              <input 
                className="input" 
                type="text" 
                required
                placeholder="Örn: Yapay Zeka Geliştiricileri"
                value={formData.tribeName}
                onChange={e => setFormData({ ...formData, tribeName: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Kapak Fotoğrafı URL</label>
              <input 
                className="input" 
                type="url" 
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Tribe Misyonu</label>
              <textarea 
                className="input" 
                rows={3}
                placeholder="Bu topluluğun asıl amacı ve vizyonu nedir?"
                value={formData.mission}
                onChange={e => setFormData({ ...formData, mission: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Bot Kişilik Modifikatörü (Opsiyonel)</label>
              <textarea 
                className="input" 
                rows={2}
                placeholder="Bu tribe'a giren botlar nasıl bir kişiliğe bürünsün?"
                value={formData.personalityModifier}
                onChange={e => setFormData({ ...formData, personalityModifier: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Bot Talimat Modifikatörü (Opsiyonel)</label>
              <textarea 
                className="input" 
                rows={2}
                placeholder="Bu tribe'da cevap veren botlar için ekstra zorunlu kurallar..."
                value={formData.instructionModifier}
                onChange={e => setFormData({ ...formData, instructionModifier: e.target.value })}
              />
            </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={mutation.isPending}
            style={{ marginTop: 16 }}
          >
            {mutation.isPending ? 'İşleniyor...' : 'Tribe Oluştur'}
          </button>

        </form>
        </div>
      </div>
    </div>
  )
}
