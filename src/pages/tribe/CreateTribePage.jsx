import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tribeApi } from '../../api/tribeApi'
import { personalityCardApi } from '../../api/personalityCardApi'
import { useNavigate } from 'react-router-dom'
import { Users, Loader2 } from 'lucide-react'
import BackButton from '../../components/common/BackButton'
import CardSelectionSlots from '../../components/card/CardSelectionSlots'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SelectionMarker from '../../components/common/SelectionMarker'
import HowItWorksHelp from '../../components/common/HowItWorksHelp'
import BotFlashCardsIcon from '../../components/common/BotFlashCardsIcon'
import PersonalityCard from '../../components/card/PersonalityCard'
import AvatarUpload from '../../components/common/AvatarUpload'

const RANDOM_TRIBE_NAMES = ['Comrades', 'Femboys', 'LGBT', 'Incels', 'Doomers']

export default function CreateTribePage() {
  useDevLog('CreateTribePage', arguments[0] || {})
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { actorId } = useAuthStore()

  const [randomTribeName] = useState(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_TRIBE_NAMES.length)
    return RANDOM_TRIBE_NAMES[randomIndex]
  })

  const [selectedCardIds, setSelectedCardIds] = useState([])

  const { data: myCards = [] } = useQuery({
    queryKey: ['myPersonalityCards', actorId],
    queryFn: () => personalityCardApi.getOwnedCards(actorId).then((res) => res.data?.data || []),
    enabled: Boolean(actorId),
    meta: { showErrorToast: true },
  })

  const [formData, setFormData] = useState({
    tribeName: '',
    imageUrl: '',
    mission: '',
    personalityCardName: '',
    personalityCardPrompt: '',
    personalityCardConfirmed: false,
  })

  const mutation = useMutation({
    mutationFn: (data) => tribeApi.createTribe(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myTribes'] })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      useMyEntitiesStore.getState().fetchMyTribes()
      setTimeout(() => {
        const newTribeId =
          typeof res.data?.data === 'string'
            ? res.data?.data
            : res.data?.data?.tribeId || res.data?.data?.id
        if (newTribeId) {
          navigate('/tribe?tribeId=' + newTribeId)
        } else {
          navigate('/')
        }
      }, 1000)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      const firstInvalid = Array.from(e.currentTarget.querySelectorAll('[data-field]')).find(
        (el) => !(el.value || '').trim()
      )
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const { personalityCardConfirmed, ...payload } = formData
    mutation.mutate({ ...payload, assignedCardIds: selectedCardIds })
  }

  const toggleCard = (cardId) => {
    setSelectedCardIds((current) =>
      current.includes(cardId)
        ? current.filter((selectedId) => selectedId !== cardId)
        : [...current, cardId]
    )
  }

  const handlePersonalityCardChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      personalityCardName: field === 'cardName' ? value : current.personalityCardName,
      personalityCardPrompt: field === 'prompt' ? value : current.personalityCardPrompt,
      personalityCardConfirmed: false,
    }))
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'

    if (isRequired) {
      return !value || !value.toString().trim() ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

  const canSubmit =
    formData.tribeName.trim() !== '' &&
    formData.mission.trim() !== '' &&
    formData.personalityCardName.trim() !== '' &&
    formData.personalityCardPrompt.trim() !== '' &&
    formData.personalityCardConfirmed &&
    !mutation.isPending

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
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
          <Users size={22} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('tribe_settings.create_tribe')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('tribe_settings.create_tribe_desc')}
          </p>
        </div>
        <HowItWorksHelp
          title={t('tribe.how_it_works')}
          items={[t('tribe.how_it_works_1'), t('tribe.how_it_works_2'), t('tribe.how_it_works_3')]}
          closeLabel={t('common.close', 'Kapat')}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      {/* Form */}
      <form
        className="create-entity-form"
        noValidate
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('tribe_settings.tribe_name')}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              data-field="tribeName"
              placeholder={t('tribe_settings.tribe_name_placeholder', {
                name: randomTribeName,
                defaultValue: `Örn: ${randomTribeName}`,
              })}
              value={formData.tribeName}
              onChange={(e) => setFormData({ ...formData, tribeName: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('tribeName', formData.tribeName, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={() => setFocused('tribeName')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('tribe_settings.mission')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={3}
              data-field="mission"
              placeholder={t('tribe_settings.mission_placeholder')}
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 100,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('mission', formData.mission, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={() => setFocused('mission')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('tribe.cover_image', 'Kapak Resmi')}
          </label>
          <AvatarUpload
            imageUrl={formData.imageUrl}
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
            disabled={mutation.isPending || mutation.isSuccess}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('card.create_personality', 'Kişilik kartı oluştur')} ({t('common.optional', 'Opsiyonel')})
          </label>
          <PersonalityCard
            variant="editor"
            editorCardName={formData.personalityCardName}
            editorPrompt={formData.personalityCardPrompt}
            editorConfirmed={formData.personalityCardConfirmed}
            disabled={mutation.isPending || mutation.isSuccess}
            onEditorChange={handlePersonalityCardChange}
            onEditorConfirm={() =>
              setFormData((current) => ({ ...current, personalityCardConfirmed: true }))
            }
            onEditorEdit={() =>
              setFormData((current) => ({ ...current, personalityCardConfirmed: false }))
            }
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
            {t('tribe_settings.primary_personality_desc')}
          </p>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t('card.select_existing_cards', 'Mevcut kartlardan seçip ekle (Opsiyonel)')}
            </label>
          </div>
          <CardSelectionSlots
            cards={myCards}
            selectedCardIds={selectedCardIds}
            onToggle={toggleCard}
            disabled={mutation.isPending || mutation.isSuccess}
            showHeader={false}
            slotCount={10}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
            {t('tribe_settings.additional_personality_cards_desc')}
          </p>
        </div>

        <div
          aria-label={t(
            'card.selected_count',
            `${selectedCardIds.length + (formData.personalityCardConfirmed ? 1 : 0)} kart seçildi`
          )}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 7,
            marginBottom: 0,
            color: 'var(--color-text-secondary)',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          <BotFlashCardsIcon size={36} color="var(--color-primary)" />
          <span>{selectedCardIds.length + (formData.personalityCardConfirmed ? 1 : 0)}</span>
        </div>

        {/* Submit button */}
        <div style={{ marginTop: 0 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending}
            style={{
              width: '100%',
              padding: '13px 24px',
              fontSize: 14,
              fontWeight: 600,
              gap: 8,
              borderRadius: 12,
              opacity: mutation.isPending ? 0.5 : 1,
              cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('auth.processing')}
              </>
            ) : (
              <>{t('action.create')}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
