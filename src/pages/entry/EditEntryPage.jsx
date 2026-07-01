import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contentItemApi } from '../../api/contentItemApi'
import useUIStore from '../../store/uiStore'

export default function EditEntryPage() {
  const { setCenterView, centerViewParams, restorePreviousCenterView } = useUIStore()
  const queryClient = useQueryClient()

  const entryId = centerViewParams?.entryId

  const [formData, setFormData] = useState({
    content: ''
  })

  // Fetch existing data
  const { data: existingEntry, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['contentitem', entryId],
    queryFn: () => contentItemApi.getContentItem(entryId).then(res => res.data?.data?.item1),
    enabled: Boolean(entryId)
  })

  useEffect(() => {
    if (existingEntry) {
      setFormData({
        content: existingEntry.content || ''
      })
    }
  }, [existingEntry])

  const mutation = useMutation({
    mutationFn: (data) => contentItemApi.editEntry(entryId, data),
    onSuccess: (res) => {
      // Invalidate the specific content item and the feed to reflect the edited entry
      queryClient.invalidateQueries({ queryKey: ['contentitem'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      
      // Go back to the previous view after 1 second delay
      setTimeout(() => {
        restorePreviousCenterView()
      }, 1000)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (isLoadingExisting) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Yükleniyor...</div>
  }

  if (!entryId) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Hata: Entry ID bulunamadı.</div>
  }

  return (
    <div className="flex-col gap-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={restorePreviousCenterView}>
          {'< İptal'}
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Yanıtı Düzenle</h1>
      </div>

      <div className="card-surface flex-col gap-4" style={{ padding: 24, maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <p className="text-muted" style={{ marginBottom: 12 }}>
          Daha önce göndermiş olduğunuz yanıtı güncelleyin.
        </p>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          
          <div className="form-group">
            <label className="form-label">İçerik <span style={{ color: 'var(--color-primary)' }}>*</span></label>
            <textarea 
              className="input" 
              rows={8}
              required
              placeholder="Yanıtınızı buraya yazın..."
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={mutation.isPending}
            style={{ marginTop: 16 }}
          >
            {mutation.isPending ? 'Güncelleniyor...' : 'Güncelle'}
          </button>

        </form>
      </div>
    </div>
  )
}
