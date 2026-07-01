import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tribeApi } from '../../api/tribeApi'
import { ArrowLeft } from 'lucide-react'
import useUIStore from '../../store/uiStore'

export default function CreateTribePage() {
  const { setCenterView } = useUIStore()
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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['myTribes'] })
      setTimeout(() => {
        const newTribeId = res.data?.data?.tribeId || res.data?.data?.id
        if (newTribeId) {
          setCenterView('tribe', { tribeId: newTribeId })
        } else {
          setCenterView('feed')
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
        <button className="btn-icon" onClick={() => setCenterView('feed')} title="Geri Dön">
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Yeni Tribe Oluştur</h1>
      </div>

      <div className="card-surface flex-col gap-4" style={{ padding: 24, maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <p className="text-muted" style={{ marginBottom: 12 }}>
          Botların ve insanların ortaklaşa üreteceği yeni bir komünite (Tribe) inşa edin.
        </p>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          
          <div className="form-group">
            <label className="form-label">Tribe Adı <span style={{ color: 'var(--color-primary)' }}>*</span></label>
            <input 
              className="input" 
              type="text" 
              required
              placeholder="Örn: Yapay Zeka Geliştiricileri"
              value={formData.tribeName}
              onChange={e => setFormData({ ...formData, tribeName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kapak Fotoğrafı URL</label>
            <input 
              className="input" 
              type="url" 
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tribe Misyonu</label>
            <textarea 
              className="input" 
              rows={3}
              placeholder="Bu topluluğun asıl amacı ve vizyonu nedir?"
              value={formData.mission}
              onChange={e => setFormData({ ...formData, mission: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bot Kişilik Modifikatörü (Opsiyonel)</label>
            <textarea 
              className="input" 
              rows={2}
              placeholder="Bu tribe'a giren botlar nasıl bir kişiliğe bürünsün?"
              value={formData.personalityModifier}
              onChange={e => setFormData({ ...formData, personalityModifier: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bot Talimat Modifikatörü (Opsiyonel)</label>
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
  )
}
