import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personalityCardApi } from '../../api/personalityCardApi'
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import CardSlots from '../../components/card/CardSlots'

export default function PersonalityCardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    cardName: '',
    personalityPrompt: '',
    tags: []
  })
  
  const { data: myCards, isLoading } = useQuery({
    queryKey: ['myPersonalityCards'],
    queryFn: () => personalityCardApi.getMyCards().then(res => res.data?.data || [])
  })
  
  const createMutation = useMutation({
    mutationFn: (data) => personalityCardApi.createCard(data),
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'))
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      setIsCreating(false)
      setFormData({ cardName: '', personalityPrompt: '', tags: [] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('common.error', 'Hata oluştu'))
    }
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.cardName.trim() || !formData.personalityPrompt.trim()) return
    createMutation.mutate(formData)
  }

  const [pendingDeleteCardId, setPendingDeleteCardId] = useState(null)

  const deleteMutation = useMutation({
    mutationFn: ({ cardId, confirmed }) => personalityCardApi.deleteCard(cardId, confirmed),
    onSuccess: (res) => {
      const data = res.data?.data
      if (data?.requiresConfirmation && data.botsInUse?.length > 0) {
        const botNames = data.botsInUse.map(b => b.botName || b.botId).join(', ')
        const ok = window.confirm(
          t('card.delete_confirm_bots', 'Bu kart şu botlarda kullanılıyor:') + '\n' + botNames + '\n' +
          t('card.delete_confirm_text', 'Yine de kartı silmek istiyor musunuz?')
        )
        if (ok) {
          deleteMutation.mutate({ cardId: pendingDeleteCardId, confirmed: true })
        }
      } else {
        toast.success(t('common.success', 'Başarılı'))
        queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      }
      setPendingDeleteCardId(null)
    },
    onError: (err) => {
      setPendingDeleteCardId(null)
      toast.error(err.message || err.response?.data?.message || t('common.error', 'Hata oluştu'))
    }
  })

  const handleDeleteCard = (card) => {
    if (!card.originalCardId) return
    setPendingDeleteCardId(card.originalCardId)
    deleteMutation.mutate({ cardId: card.originalCardId, confirmed: false })
  }
  
  return (
    <div className="flex-col gap-4">
      <div className="px-2" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackButton text={t('common.go_back', 'Geri Dön')} onClick={() => navigate(-1)} style={{ marginBottom: 0 }} />
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => setIsCreating(!isCreating)}
          style={{ borderRadius: 20, padding: '6px 14px' }}
        >
          {isCreating ? t('common.cancel', 'İptal') : <><Plus size={16} /> {t('card.create_new', 'Yeni Kart')}</>}
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div className="page-header-icon">
          <BookOpen size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('card.my_cards', 'Kişilik Kartlarım')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('card.my_cards_desc', 'Oluşturduğunuz ve satın aldığınız kişilik kartları')}
          </p>
        </div>
      </div>

      {/* Slots Section */}
      <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('card.ownership_slots', 'Kart Sahiplik Yuvaları (10 Slot)')}
          </h3>
          <CardSlots cards={myCards} slotCount={10} />
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, background: 'var(--color-surface-2)', borderRadius: 12, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('card.card_name', 'Kart Adı')} *</label>
            <input 
              className="input" 
              value={formData.cardName} 
              onChange={e => setFormData(p => ({ ...p, cardName: e.target.value }))}
              placeholder={t('card.card_name_placeholder', 'Örn: Bilge Filozof')}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('card.prompt', 'Kişilik Promptu')} *</label>
            <textarea 
              className="input" 
              style={{ minHeight: 100, resize: 'vertical' }}
              value={formData.personalityPrompt} 
              onChange={e => setFormData(p => ({ ...p, personalityPrompt: e.target.value }))}
              placeholder={t('card.prompt_placeholder', 'Sen bilge bir filozofsun...')}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('common.saving', 'Kaydediliyor...') : t('common.save', 'Kaydet')}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>{t('common.loading', 'Yükleniyor...')}</div>
        ) : myCards?.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>{t('card.no_cards', 'Henüz kartınız yok.')}</div>
        ) : (
          myCards?.map(card => (
            <div key={card.ownershipId || card.cardId} style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{card.card?.cardName || card.cardName}</h3>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}>
                  {card.acquisitionType === 0 ? 'Created' : 'Purchased'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', flex: 1 }}>
                {card.card?.cardHint || card.cardHint || card.card?.personalityPrompt || card.personalityPrompt}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                {card.acquisitionType === 0 && card.originalCardId && (
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    onClick={() => handleDeleteCard(card)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={14} style={{ marginRight: 4 }} /> {t('common.delete', 'Sil')}
                  </button>
                )}
                <button className="btn btn-sm btn-outline">
                  <Edit2 size={14} style={{ marginRight: 4 }} /> {t('common.edit', 'Düzenle')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
