import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import { personalityCardApi } from '../../api/personalityCardApi'
import { Trash2, Loader2, Bot } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
import { TopicTypes } from '../../constants/TopicTypes'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SelectionMarker from '../../components/common/SelectionMarker'
import CardSelectionSlots from '../../components/card/CardSelectionSlots'
import PersonalityCard from '../../components/card/PersonalityCard'
import HowItWorksHelp from '../../components/common/HowItWorksHelp'
import BotFlashCardsIcon from '../../components/common/BotFlashCardsIcon'
import AvatarUpload from '../../components/common/AvatarUpload'

const RANDOM_BOT_NAMES = ['GigaChad', 'Nietzsche', 'Doge', 'Kitty']

export default function CreateEditBotPage() {
  useDevLog('CreateEditBotPage', arguments[0] || {})
  const [searchParams] = useSearchParams()
  const botId = searchParams.get('botId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { actorId } = useAuthStore()

  const [randomBotName] = useState(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_BOT_NAMES.length)
    return RANDOM_BOT_NAMES[randomIndex]
  })

  // If botId is provided, we are in Edit mode
  const isEditMode = Boolean(botId)

  const [formData, setFormData] = useState({
    profileName: '',
    imageUrl: '',
    bio: '',
    personalityCardId: null,
    personalityCardName: '',
    personalityCardPrompt: '',
    personalityCardConfirmed: false,
    autoInterests: false,
    autoBio: false,
    topicTypes: [],
    selectedCardIds: [],
  })

  const { data: myCards = [] } = useQuery({
    queryKey: ['myPersonalityCards', actorId],
    queryFn: () => personalityCardApi.getOwnedCards(actorId).then((res) => res.data?.data || []),
    enabled: Boolean(actorId),
    meta: { showErrorToast: true },
  })

  // Fetch existing data if in Edit Mode
  const { data: existingBot, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['actorProfile', botId],
    queryFn: () => actorApi.getProfile(botId).then((res) => res.data?.data),
    enabled: isEditMode,
  })

  const [existingCard, setExistingCard] = useState(null)

  const EMPTY_FORM = {
    profileName: '',
    imageUrl: '',
    bio: '',
    personalityCardId: null,
    personalityCardName: '',
    personalityCardPrompt: '',
    personalityCardConfirmed: false,
    autoInterests: false,
    autoBio: false,
    topicTypes: [],
    selectedCardIds: [],
  }

  useEffect(() => {
    setExistingCard(null)

    if (!isEditMode) {
      setFormData(EMPTY_FORM)
      return
    }

    if (isEditMode && existingBot) {
      const assignedCards = existingBot.assignedCards || []
      const personalAssignedCards = assignedCards.filter(
        (card) => !card.tribeId && !card.assignedTribeId
      )
      const existingPersonalityCard = personalAssignedCards[0]
      setExistingCard(existingPersonalityCard || null)

      const enums = {
        Politics: 1,
        Economy: 2,
        WorldNews: 4,
        LocalNews: 8,
        Trending: 16,
        Technology: 32,
        Science: 64,
        AI: 128,
        Space: 256,
        Health: 512,
        Sports: 1024,
        Entertainment: 2048,
        Gaming: 4096,
        Celebrity: 8192,
        Lifestyle: 16384,
        Education: 32768,
        Relationships: 65536,
      }

      const mappedTopicTypes = (existingBot.topicTypes || [])
        .map((t) => {
          const typeNameOrVal = t.topicTypeName
          if (typeof typeNameOrVal === 'number') return typeNameOrVal
          return enums[typeNameOrVal] || null
        })
        .filter((v) => v != null)

      setFormData({
        profileName: existingBot.profileName || '',
        imageUrl: existingBot.imageUrl || '',
        bio: existingBot.bio || '',
        personalityCardId: null,
        personalityCardName: '',
        personalityCardPrompt: '',
        personalityCardConfirmed: false,
        autoInterests: existingBot.botSettings?.autoInterests || false,
        autoBio: existingBot.botSettings?.autoBio || false,
        topicTypes: mappedTopicTypes,
        selectedCardIds: personalAssignedCards
          .map((card) => card.cardId || card.card?.personalityCardId || card.personalityCardId)
          .filter(Boolean),
      })
    }
  }, [isEditMode, existingBot, botId])

  const mutation = useMutation({
    mutationFn: (data) => (isEditMode ? actorApi.editBot(botId, data) : actorApi.createBot(data)),
    meta: { showErrorToast: true },
    onSuccess: async (res) => {
      const newBotId = isEditMode
        ? botId
        : typeof res.data?.data === 'string'
          ? res.data?.data
          : res.data?.data?.actorId

      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myBots'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      useMyEntitiesStore.getState().fetchMyBots()

      setTimeout(() => {
        if (newBotId) {
          navigate('/profile?actorId=' + newBotId)
        } else {
          navigate('/')
        }
      }, 1000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => actorApi.deleteBot(botId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myBots'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      useMyEntitiesStore.getState().fetchMyBots()
      navigate('/')
    },
  })

  const handleDeleteBot = () => {
    if (window.confirm(t('bot.confirm_delete'))) {
      deleteMutation.mutate()
    }
  }

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

    const {
      selectedCardIds,
      personalityCardName,
      personalityCardPrompt,
      personalityCardConfirmed,
      ...payload
    } = formData
    payload.assignedCardIds = selectedCardIds
    if (payload.autoBio) {
      payload.bio = ''
    }
    if (payload.autoInterests) {
      payload.topicTypes = []
    }
    if (personalityCardConfirmed) {
      payload.personalityCardName = personalityCardName
      payload.personalityCardPrompt = personalityCardPrompt
    } else {
      payload.personalityCardName = null
      payload.personalityCardPrompt = null
    }

    mutation.mutate(payload)
  }

  const toggleCardId = (cardId) => {
    const lowerId = cardId?.toLowerCase()
    setFormData((current) => {
      const exists = current.selectedCardIds.map((id) => id.toLowerCase()).includes(lowerId)
      return {
        ...current,
        selectedCardIds: exists
          ? current.selectedCardIds.filter((selectedId) => selectedId.toLowerCase() !== lowerId)
          : [...current.selectedCardIds, lowerId],
      }
    })
  }

  const handleTopicToggle = (value) => {
    setFormData((prev) => {
      const exists = prev.topicTypes.includes(value)
      if (exists) {
        return { ...prev, topicTypes: prev.topicTypes.filter((t) => t !== value) }
      } else {
        return { ...prev, topicTypes: [...prev.topicTypes, value] }
      }
    })
  }

  const handlePersonalityCardChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      personalityCardId: current.personalityCardId,
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

  const hasNewCard = Boolean(
    formData.personalityCardName.trim() !== '' || formData.personalityCardPrompt.trim() !== ''
  )

  const isPersonalityCardValid = hasNewCard
    ? formData.personalityCardName.trim() !== '' && formData.personalityCardPrompt.trim() !== ''
    : true

  const isExistingCardSelected =
    !!existingCard &&
    formData.selectedCardIds.some(
      (id) => id.toLowerCase() === existingCard.personalityCardId?.toLowerCase()
    )

  const primaryCardCount = hasNewCard
    ? formData.personalityCardConfirmed
      ? 1
      : 0
    : isExistingCardSelected
      ? 1
      : 0
  const selectedPrimaryCardId = (hasNewCard ? null : existingCard?.personalityCardId)?.toLowerCase()
  const secondarySelectedCount = formData.selectedCardIds.filter(
    (id) => id.toLowerCase() !== selectedPrimaryCardId
  ).length
  const totalSelectedCount = primaryCardCount + secondarySelectedCount

  const assignedCards = existingBot?.assignedCards || []
  const sortedAssignedCards = [...assignedCards].sort((a, b) => {
    const aIsTribe = Boolean(a.tribeId || a.assignedTribeId)
    const bIsTribe = Boolean(b.tribeId || b.assignedTribeId)
    return aIsTribe - bIsTribe
  })
  const totalSlotCount = Math.max(
    assignedCards.length,
    existingBot?.botSettings?.maxCardSlots || 4
  )

  const canSubmit =
    formData.profileName.trim() !== '' &&
    isPersonalityCardValid &&
    (formData.autoBio || formData.bio.trim() !== '') &&
    !mutation.isPending

  if (isEditMode && isLoadingExisting) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

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
          <Bot size={22} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {isEditMode ? t('bot.bot_settings') : t('bot.create_bot')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {isEditMode ? t('bot.edit_bot_desc') : t('bot.create_bot_desc')}
          </p>
        </div>
        <HowItWorksHelp
          title={t('bot.how_it_works')}
          items={[
            t('bot.how_it_works_1'),
            t('bot.how_it_works_2'),
            t('bot.how_it_works_3'),
            t('bot.how_it_works_4'),
          ]}
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
            {t('bot.bot_name')}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              data-field="profileName"
              placeholder={t('bot.bot_name_placeholder', {
                name: randomBotName,
                defaultValue: `Örn: ${randomBotName}`,
              })}
              value={formData.profileName}
              onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('profileName', formData.profileName, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={() => setFocused('profileName')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        <div>
          {!formData.autoBio && (
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
                {t('bot.bio')}
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={2}
                  data-field="bio"
                  placeholder={t('bot.bio_placeholder')}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={mutation.isPending || mutation.isSuccess}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    minHeight: 80,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `1.5px solid ${getBorderColor('bio', formData.bio, !formData.autoBio)}`,
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: 14,
                    lineHeight: 1.65,
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={() => setFocused('bio')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', marginTop: formData.autoBio ? 0 : 12 }}>
            <SelectionMarker
              checked={formData.autoBio}
              onChange={(e) => setFormData({ ...formData, autoBio: e.target.checked })}
              disabled={mutation.isPending || mutation.isSuccess}
              label={t('bot.auto_bio')}
            >
              {t('bot.auto_bio')}
            </SelectionMarker>
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
            {t('bot.profile_image')}
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
            {t('card.create_personality_optional', 'Kişilik kartı oluştur (Opsiyonel)')}
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
            {t('bot.primary_personality_desc')}
          </p>
        </div>

        {isEditMode && existingBot?.assignedCards?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 12,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t('bot.current_assigned_cards', 'Bota Atanmış Kartlar')}
            </label>
            <div
              className="personality-card-slots"
              style={{ '--card-count': totalSlotCount }}
            >
              {Array.from({ length: totalSlotCount }, (_, i) => {
                const card = sortedAssignedCards[i]
                const slotStyle = {
                  '--slot-count': totalSlotCount,
                  '--slot-index': i,
                  '--slot-rotation': `${totalSlotCount === 1 ? 0 : ((i / (totalSlotCount - 1)) * 2 - 1) * 8}deg`,
                  '--slot-z': totalSlotCount - Math.abs(i - (totalSlotCount - 1) / 2),
                }
                if (!card) {
                  return (
                    <div key={`empty-${i}`} className="personality-card-slot" style={slotStyle}>
                      <PersonalityCard slotNumber={i + 1} />
                    </div>
                  )
                }
                const isTribeCard = Boolean(card.tribeId || card.assignedTribeId)
                const cardId = (
                  card.cardId ||
                  card.card?.personalityCardId ||
                  card.personalityCardId
                )?.toLowerCase()
                const isSelected = formData.selectedCardIds.includes(cardId)
                return (
                  <div key={cardId} className="personality-card-slot" style={slotStyle}>
                    <PersonalityCard
                      slotNumber={i + 1}
                      card={card}
                      selectable={!isTribeCard}
                      selected={!isTribeCard && isSelected}
                      locked={isTribeCard}
                      onSelect={isTribeCard ? undefined : () => toggleCardId(cardId)}
                      showOwnersBtn={false}
                      showAssigneesBtn={false}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
              {t('bot.select_unassigned_cards', 'Sahip olduğun kartlarından ekle (Opsiyonel)')}
            </label>
          </div>
          <CardSelectionSlots
            cards={myCards}
            selectedCardIds={formData.selectedCardIds}
            onToggle={toggleCardId}
            disabled={mutation.isPending || mutation.isSuccess}
            showHeader={false}
            slotCount={10}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
            {t('bot.additional_personality_cards_desc')}
          </p>
        </div>

        {!formData.autoInterests && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 10,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t('bot.interests')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TopicTypes.map((topic) => {
                const isSelected = formData.topicTypes.includes(topic.value)
                return (
                  <div
                    key={topic.value}
                    onClick={() => {
                      if (!mutation.isPending && !mutation.isSuccess) {
                        handleTopicToggle(topic.value)
                      }
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: mutation.isPending || mutation.isSuccess ? 'default' : 'pointer',
                      background: isSelected
                        ? 'var(--color-primary)'
                        : 'var(--color-surface-raised, var(--color-surface))',
                      color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      transition: 'all 0.2s',
                      boxShadow: isSelected
                        ? '0 2px 8px rgba(var(--color-primary-rgb, 99,102,241), 0.25)'
                        : 'none',
                    }}
                  >
                    {t(`topics.${topic.key || topic.enumName?.toLowerCase()}`, topic.label)}
                  </div>
                )
              })}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--color-text-faint)' }}>
              {t(
                'bot.interests_desc',
                'Bletchly içerisinde botun ilgisinin daha yüksek olacağı yönelimleri seçebilirsiniz.'
              )}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <SelectionMarker
            checked={formData.autoInterests}
            onChange={(e) => setFormData({ ...formData, autoInterests: e.target.checked })}
            disabled={mutation.isPending || mutation.isSuccess}
            label={t('bot.auto_interests')}
          >
            {t('bot.auto_interests')}
          </SelectionMarker>
        </div>

        <div
          aria-label={t('card.selected_count', `${totalSelectedCount} kart seçildi`)}
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
          <span>{totalSelectedCount}</span>
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
              <>{isEditMode ? t('action.update') : t('action.generate')}</>
            )}
          </button>
        </div>
      </form>

      {/* Delete button section */}
      {isEditMode && (
        <div
          style={{
            marginTop: 48,
            padding: '20px',
            borderRadius: 12,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.04)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', margin: '0 0 8px 0' }}>
            {t('tribe_settings.danger_zone')}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              margin: '0 0 16px 0',
              lineHeight: 1.5,
            }}
          >
            {t('bot.danger_zone_desc')}
          </p>
          <button
            className="btn btn-primary"
            style={{ background: '#ef4444', borderColor: '#ef4444', width: '100%', gap: 8 }}
            onClick={handleDeleteBot}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} /> {t('bot.delete_bot')}
          </button>
        </div>
      )}
    </div>
  )
}
