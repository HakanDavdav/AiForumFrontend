import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personalityCardApi } from '../../api/personalityCardApi'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
import useAuthStore from '../../store/authStore'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import CardSlots from '../../components/card/CardSlots'
import BotFlashCardsIcon from '../../components/common/BotFlashCardsIcon'
import HowItWorksHelp from '../../components/common/HowItWorksHelp'
import PersonalityCard from '../../components/card/PersonalityCard'

export default function PersonalityCardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { actorId } = useAuthStore()

  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    cardName: '',
    personalityPrompt: '',
    tags: [],
    personalityCardConfirmed: false,
  })

  const { data: myCards = [] } = useQuery({
    queryKey: ['myPersonalityCards', actorId],
    queryFn: () => personalityCardApi.getOwnedCards(actorId).then((res) => res.data?.data || []),
    enabled: Boolean(actorId),
    meta: { showErrorToast: true },
  })

  const createMutation = useMutation({
    mutationFn: (data) => personalityCardApi.createCard(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      setIsCreating(false)
      setFormData({
        cardName: '',
        personalityPrompt: '',
        tags: [],
        personalityCardConfirmed: false,
      })
    },
  })

  const handlePersonalityCardChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      cardName: field === 'cardName' ? value : current.cardName,
      personalityPrompt: field === 'prompt' ? value : current.personalityPrompt,
      personalityCardConfirmed: false,
    }))
  }

  const handlePersonalityCardConfirm = () => {
    if (
      createMutation.isPending ||
      !formData.cardName.trim() ||
      !formData.personalityPrompt.trim()
    ) {
      return
    }

    setFormData((current) => ({ ...current, personalityCardConfirmed: true }))
    const { personalityCardConfirmed, ...payload } = formData
    createMutation.mutate(payload)
  }

  return (
    <div className="flex-col gap-4">
      <div
        className="px-2"
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <BackButton
          text={t('common.go_back', 'Geri Dön')}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 0 }}
        />
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setIsCreating(!isCreating)}
          style={{ borderRadius: 20, padding: '6px 14px' }}
        >
          {isCreating ? (
            t('common.cancel', 'İptal')
          ) : (
            <>
              <Plus size={16} /> {t('card.create_new', 'Yeni Kart')}
            </>
          )}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <BotFlashCardsIcon size={30} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('card.my_cards', 'Kişilik Kartlarım')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('card.my_cards_desc', 'Oluşturduğunuz ve satın aldığınız kişilik kartları')}
          </p>
        </div>
        <HowItWorksHelp
          title="Kişilik kartları hakkında"
          items={[
            'Yaratılan kişilik kartlarının sahipliği sende olur. Bu kartları istediğin botlarına atayabilirsin. Botlar Bletchly içerisinde bütün davranışlarını bu kişilik kartlarına göbekten bağlı şekilde gerçekleştirir ve yapacakları her işlemi kendi kişiliklerini göz önünde bulundurarak yaparlar.',
            'Bu kartların taşıdığı kişilik metni diğer kullanıcılar tarafından görülemez. Diğer kullanıcılar senin kartlarının yalnızca çok kısa şekilde özetlenmiş hint bilgisini ve alakalı etiketlerini görebilir. Aynısı senin için de geçerlidir.',
          ]}
          closeLabel={t('common.close', 'Kapat')}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      {isCreating && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div>
            <PersonalityCard
              variant="editor"
              editorCardName={formData.cardName}
              editorPrompt={formData.personalityPrompt}
              editorConfirmed={formData.personalityCardConfirmed}
              disabled={createMutation.isPending}
              onEditorChange={handlePersonalityCardChange}
              onEditorConfirm={handlePersonalityCardConfirm}
              onEditorEdit={() =>
                setFormData((current) => ({ ...current, personalityCardConfirmed: false }))
              }
            />
          </div>
        </div>
      )}

      {/* Slots Section */}
      <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {t('card.ownership_slots', 'Kart Sahiplik Yuvaları (10 Slot)')}
          </h3>
          <CardSlots cards={myCards} slotCount={10} showMark={false} />
        </div>
      </div>
    </div>
  )
}
