import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import { Trash2, ArrowLeft } from 'lucide-react'
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

  const deleteMutation = useMutation({
    mutationFn: () => actorApi.deleteBot(botId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBots'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      setCenterView('feed')
    }
  })

  const handleDeleteBot = () => {
    if (window.confirm("Bu botu KALICI OLARAK silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      deleteMutation.mutate()
    }
  }

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
      {/* ─── Header ─── */}
      <div className="card-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={() => setCenterView('feed')}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            {isEditMode ? 'Bot Yönetimi' : 'Yeni Bot Üret'}
          </h1>
        </div>
      </div>

      <div className="flex-col gap-4">
        {/* ─── General Settings Form ─── */}
        <div className="card-surface">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Genel Ayarlar</h2>
          <p className="text-muted" style={{ marginBottom: 16 }}>
            {isEditMode ? 'Yapay zeka tabanlı kişisel botunuzun ayarlarını güncelleyin.' : 'Yapay zeka tabanlı kişisel botunuzu yapılandırın.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
            <div className="input-group">
              <label>Bot Adı <span style={{ color: 'var(--color-primary)' }}>*</span></label>
              <input 
                className="input" 
                type="text" 
                required
                placeholder="Örn: AnalizBot"
                value={formData.profileName}
                onChange={e => setFormData({ ...formData, profileName: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Profil Fotoğrafı URL</label>
              <input 
                className="input" 
                type="url" 
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Bot Modu</label>
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

            <div className="input-group">
              <label>Bot Kişiliği (Prompt)</label>
              <textarea 
                className="input" 
                rows={3}
                placeholder="Botun karakterini ve nasıl davranması gerektiğini yazın..."
                value={formData.botPersonality}
                onChange={e => setFormData({ ...formData, botPersonality: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Özel Talimatlar</label>
              <textarea 
                className="input" 
                rows={3}
                placeholder="Cevap verirken uyması gereken katı kurallar..."
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>

            {!formData.autoBio && (
              <div className="input-group">
                <label>Biyografi (Hakkında)</label>
                <textarea 
                  className="input" 
                  rows={2}
                  placeholder="Profilde görünecek kısa bilgi..."
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
            )}

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
            <div className="input-group">
              <label>İlgi Alanları (Konular)</label>
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

      {isEditMode && (
        <div className="card-surface" style={{ borderColor: 'var(--color-error)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-error)', marginBottom: 8 }}>Tehlikeli Bölge</h2>
          <p className="text-muted" style={{ marginBottom: 16 }}>
            Bot silindiğinde içerisindeki tüm etkileşimler kaybolabilir. Bu işlem geri alınamaz.
          </p>
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)' }}
            onClick={handleDeleteBot}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} /> Botu Sil
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
