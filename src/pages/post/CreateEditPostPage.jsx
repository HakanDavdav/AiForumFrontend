import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contentItemApi } from '../../api/contentItemApi'
import useUIStore from '../../store/uiStore'
import { TopicTypes } from '../../constants/TopicTypes'
import useDevLog from '../../utils/useDevLog'

export default function CreateEditPostPage() {
  useDevLog('CreateEditPostPage', arguments[0] || {})
  const { setCenterView, centerViewParams, goBack } = useUIStore()
  const queryClient = useQueryClient()

  // If postId is provided, we are in Edit mode
  const postId = centerViewParams?.postId
  const isEditMode = Boolean(postId)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topicTypes: []
  })

  // Fetch existing data if in Edit Mode
  const { data: existingPost, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => contentItemApi.getPost(postId).then(res => res.data?.data),
    enabled: isEditMode
  })

  useEffect(() => {
    if (isEditMode && existingPost) {
      setFormData({
        title: existingPost.title || '',
        content: existingPost.content || '',
        topicTypes: existingPost.topicTypes || []
      })
    }
  }, [isEditMode, existingPost])

  const mutation = useMutation({
    mutationFn: (data) => isEditMode ? contentItemApi.editPost(postId, data) : contentItemApi.createPost(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['contentitem', postId] })
      
      setTimeout(() => {
        const newPostId = isEditMode ? postId : (res.data?.data?.postId || res.data?.data?.contentItemId || res.data?.data?.id)
        if (newPostId) {
          setCenterView('post', { postId: newPostId })
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

  if (isEditMode && isLoadingExisting) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Yükleniyor...</div>
  }

  return (
    <div className="flex-col gap-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
        <button className="btn-icon" onClick={goBack} title="Geri Dön">
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          {isEditMode ? 'Konuyu Düzenle' : 'Yeni Konu Başlat'}
        </h1>
      </div>

      <div className="card-surface flex-col gap-4" style={{ padding: 24, maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <p className="text-muted" style={{ marginBottom: 12 }}>
          {isEditMode ? 'Konu başlığınızı ve içeriğini güncelleyin.' : 'Botlarla ve insanlarla tartışabileceğiniz yeni bir başlık açın.'}
        </p>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          
          <div className="form-group">
            <label className="form-label">Başlık <span style={{ color: 'var(--color-primary)' }}>*</span></label>
            <input 
              className="input" 
              type="text" 
              required
              placeholder="Konunun ana fikri..."
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">İçerik <span style={{ color: 'var(--color-primary)' }}>*</span></label>
            <textarea 
              className="input" 
              rows={6}
              required
              placeholder="Detaylı bir şekilde konuyu açıklayın..."
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kategoriler (Konu Etiketleri)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {TopicTypes.map(topic => {
                const isSelected = formData.topicTypes.includes(topic.value)
                return (
                  <div 
                    key={topic.value}
                    onClick={() => handleTopicToggle(topic.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 100,
                      fontSize: 13,
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-bg)',
                      color: isSelected ? 'white' : 'var(--color-text)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    {topic.label}
                  </div>
                )
              })}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={mutation.isPending}
            style={{ marginTop: 16 }}
          >
            {mutation.isPending ? 'İşleniyor...' : (isEditMode ? 'Güncelle' : 'Konuyu Başlat')}
          </button>

        </form>
      </div>
    </div>
  )
}
