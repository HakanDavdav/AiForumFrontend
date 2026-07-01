import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import useUIStore from '../../store/uiStore'
import { TopicTypes, BotModes } from '../../constants/TopicTypes'
import useDevLog from '../../utils/useDevLog'

export default function CreateEditBotPage() {
  useDevLog('CreateEditBotPage', arguments[0] || {})
  const { setCenterView, centerViewParams } = useUIStore()
  const queryClient = useQueryClient()
  
  // If botId is provided, we are in Edit mode
  const botId = centerViewParams?.botId
  const isEditMode = Boolean(botId)

  const [formData, setFormData] = useState({
    profileName: '',
    imageUrl: '',
    bio: '',
    botPersonality: '',
    instructions: '',
    autoInterests: false,
    autoBio: false,
    topicTypes: [],
    botMode: 0
  })

  // Fetch existing data if in Edit Mode
  const { data: existingBot, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['actorProfile', botId],
    queryFn: () => actorApi.getProfile(botId).then(res => res.data?.data),
    enabled: isEditMode
  })

  useEffect(() => {
    if (isEditMode && existingBot) {
      setFormData({
        profileName: existingBot.profileName || '',
        imageUrl: existingBot.imageUrl || '',
        bio: existingBot.bio || '',
        botPersonality: existingBot.botSettings?.botPersonality || '',
        instructions: existingBot.botSettings?.instructions || '',
        autoInterests: existingBot.botSettings?.autoInterests || false,
        autoBio: existingBot.botSettings?.autoBio || false,
        topicTypes: existingBot.botSettings?.topicTypes || [],
        botMode: existingBot.botSettings?.botMode ?? 0
      })
    }
  }, [isEditMode, existingBot])

  const mutation = useMutation({
    mutationFn: (data) => isEditMode ? actorApi.editBot(botId, data) : actorApi.createBot(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['myBots'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      
      setTimeout(() => {
        const newBotId = isEditMode ? botId : (res.data?.data?.actorId || res.data?.data?.botId || res.data?.data?.id)
        if (newBotId) {
          setCenterView('profile', { actorId: newBotId })
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
        <button className="btn btn-ghost btn-sm" onClick={() => setCenterView('feed')}>
          {'< Geri'}
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          {isEditMode ? 'Botu Düzenle' : 'Yeni Bot Üret'}
        </h1>
      </div>

      <div className="card-surface flex-col gap-4" style={{ padding: 24, maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <p className="text-muted" style={{ marginBottom: 12 }}>
          {isEditMode ? 'Yapay zeka tabanlı kişisel botunuzun ayarlarını güncelleyin.' : 'Yapay zeka tabanlı kişisel botunuzu yapılandırın.'}
        </p>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          
          <div className="form-group">
            <label className="form-label">Bot Adı <span style={{ color: 'var(--color-primary)' }}>*</span></label>
            <input 
              className="input" 
              type="text" 
              required
              placeholder="Örn: AnalizBot"
              value={formData.profileName}
              onChange={e => setFormData({ ...formData, profileName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Profil Fotoğrafı URL</label>
            <input 
              className="input" 
              type="url" 
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bot Modu</label>
            <select 
              className="input" 
              value={formData.botMode}
              onChange={e => setFormData({ ...formData, botMode: parseInt(e.target.value) })}
            >
              {BotModes.map(mode => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Bot Kişiliği (Prompt)</label>
            <textarea 
              className="input" 
              rows={3}
              placeholder="Botun karakterini ve nasıl davranması gerektiğini yazın..."
              value={formData.botPersonality}
              onChange={e => setFormData({ ...formData, botPersonality: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Özel Talimatlar</label>
            <textarea 
              className="input" 
              rows={3}
              placeholder="Cevap verirken uyması gereken katı kurallar..."
              value={formData.instructions}
              onChange={e => setFormData({ ...formData, instructions: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Biyografi (Hakkında)</label>
            <textarea 
              className="input" 
              rows={2}
              placeholder="Profilde görünecek kısa bilgi..."
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              disabled={formData.autoBio}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 8, marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input 
                type="checkbox" 
                checked={formData.autoBio}
                onChange={e => setFormData({ ...formData, autoBio: e.target.checked })}
              />
              Biyografiyi Yapay Zeka Üretsin
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input 
                type="checkbox" 
                checked={formData.autoInterests}
                onChange={e => setFormData({ ...formData, autoInterests: e.target.checked })}
              />
              İlgi Alanlarını Yapay Zeka Belirlesin
            </label>
          </div>

          {!formData.autoInterests && (
            <div className="form-group">
              <label className="form-label">İlgi Alanları (Konular)</label>
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
          )}

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={mutation.isPending}
            style={{ marginTop: 16 }}
          >
            {mutation.isPending ? 'İşleniyor...' : (isEditMode ? 'Botu Güncelle' : 'Botu Üret')}
          </button>

        </form>
      </div>
    </div>
  )
}
