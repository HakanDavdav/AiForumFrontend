import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Shield, UserMinus, Users, Loader2 } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tribeApi } from '../api/tribeApi'
import { personalityCardApi } from '../api/personalityCardApi'
import BackButton from '../components/common/BackButton'
import BotFlashCardsIcon from '../components/common/BotFlashCardsIcon'
import CardSelectionSlots from '../components/card/CardSelectionSlots'
import PersonalityCard from '../components/card/PersonalityCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import AvatarUpload from '../components/common/AvatarUpload'
import useAuthStore from '../store/authStore'
import useMyEntitiesStore from '../store/myEntitiesStore'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function TribeSettingsPage() {
  const [searchParams] = useSearchParams()
  const tribeId = searchParams.get('tribeId')
  useDevLog('TribeSettingsPage', arguments[0] || {})
  const { actorId: currentUserId } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  // Form states
  const [formData, setFormData] = useState({
    tribeName: '',
    imageUrl: '',
    mission: '',
    personalityCardName: '',
    personalityCardPrompt: '',
    personalityCardConfirmed: false,
  })
  const [selectedCardIds, setSelectedCardIds] = useState([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  // Fetch Tribe
  const { data: tribe, isLoading } = useQuery({
    queryKey: ['tribe', tribeId],
    queryFn: () => tribeApi.getTribe(tribeId).then((r) => r.data?.data ?? null),
    enabled: !!tribeId,
  })

  const { data: myCards = [] } = useQuery({
    queryKey: ['myPersonalityCards', currentUserId],
    queryFn: () =>
      personalityCardApi.getOwnedCards(currentUserId).then((res) => res.data?.data || []),
    enabled: Boolean(currentUserId),
    meta: { showErrorToast: true },
  })

  // Populate form
  useEffect(() => {
    if (tribe) {
      setFormData({
        tribeName: tribe.tribeName || '',
        imageUrl: tribe.imageUrl || '',
        mission: tribe.mission || '',
      })
      setSelectedCardIds(
        (tribe.personalityCards || []).map((card) => card.cardId || card.card?.personalityCardId || card.personalityCardId).filter(Boolean)
      )
    }
  }, [tribe])

  // Mutations
  const editMutation = useMutation({
    mutationFn: (dto) => tribeApi.editTribe(tribeId, dto),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('tribe_settings.success_update', 'Değişiklikler kaydedildi'))
      queryClient.invalidateQueries({ queryKey: ['tribe', tribeId] })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      setTimeout(() => {
        navigate('/tribe?tribeId=' + tribeId)
      }, 1000)
    },
  })

  const expelMutation = useMutation({
    mutationFn: (memberActorId) => tribeApi.expelMember(tribeId, memberActorId),
    meta: { showErrorToast: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tribe', tribeId] }),
  })

  const rankMutation = useMutation({
    mutationFn: ({ memberActorId, promotionType }) =>
      tribeApi.changeRank(tribeId, memberActorId, promotionType),
    meta: { showErrorToast: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tribe', tribeId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => tribeApi.deleteTribe(tribeId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'))
      queryClient.invalidateQueries({ queryKey: ['tribe'] })
      queryClient.invalidateQueries({ queryKey: ['myTribes'] })
      useMyEntitiesStore.getState().fetchMyTribes()
      navigate('/')
    },
  })

  if (isLoading)
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  if (!tribe) return <div className="empty-state">{t('tribe_settings.not_found')}</div>

  const isLeader = tribe.tribeMemberships?.some(
    (m) => m.actor?.actorId === currentUserId && m.roleName === 'TribeLeader'
  )
  if (!isLeader) {
    return (
      <div className="empty-state">
        <h2 style={{ color: 'var(--color-error)' }}>{t('tribe_settings.unauthorized')}</h2>
        <p>{t('tribe_settings.unauthorized_desc')}</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/tribe?tribeId=' + tribeId)}
          style={{ marginTop: 16 }}
        >
          {t('tribe_settings.return_to_tribe')}
        </button>
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePersonalityCardChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      personalityCardName: field === 'cardName' ? value : current.personalityCardName,
      personalityCardPrompt: field === 'prompt' ? value : current.personalityCardPrompt,
      personalityCardConfirmed: false,
    }))
  }

  const toggleCard = (cardId) => {
    const lowerId = cardId?.toLowerCase()
    setSelectedCardIds((current) =>
      current.map((id) => id.toLowerCase()).includes(lowerId)
        ? current.filter((selectedId) => selectedId.toLowerCase() !== lowerId)
        : [...current, lowerId]
    )
  }

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'

    if (isRequired) {
      return !value || !value.trim() ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

  const canSubmit = formData.tribeName.trim() !== '' && !editMutation.isPending

  const handleSave = (e) => {
    e.preventDefault()

    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }

    const { personalityCardName, personalityCardPrompt, personalityCardConfirmed, ...base } =
      formData

    editMutation.mutate({
      ...base,
      assignedCardIds: selectedCardIds,
      personalityCardName: personalityCardConfirmed ? personalityCardName : null,
      personalityCardPrompt: personalityCardConfirmed ? personalityCardPrompt : null,
    })
  }

  const handleDeleteTribe = () => {
    if (window.confirm(t('tribe_settings.confirm_delete'))) {
      deleteMutation.mutate()
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: 8,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  }

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton
          onClick={() => navigate('/tribe?tribeId=' + tribeId)}
          style={{ marginBottom: 0 }}
        />
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
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('tribe_settings.title')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t(
              'tribe_settings.title_desc',
              'Klanınızın genel ayarlarını ve üyelerini buradan yönetebilirsiniz.'
            )}
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        noValidate
        onSubmit={handleSave}
        style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div>
          <label style={labelStyle}>
            COVER IMAGE
          </label>
          <AvatarUpload
            imageUrl={formData.imageUrl}
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
            disabled={editMutation.isPending}
          />
        </div>
        <div>
          <label style={labelStyle}>
            {t('tribe_settings.tribe_name')}{' '}
            <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              name="tribeName"
              value={formData.tribeName}
              onChange={handleChange}
              disabled={editMutation.isPending}
              style={{
                ...inputStyle,
                borderColor: getBorderColor('tribeName', formData.tribeName, true),
              }}
              onFocus={() => setFocused('tribeName')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{t('tribe_settings.mission')}</label>
          <div style={{ position: 'relative' }}>
            <textarea
              name="mission"
              rows={3}
              value={formData.mission}
              onChange={handleChange}
              disabled={editMutation.isPending}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 100,
                lineHeight: 1.65,
                borderColor: getBorderColor('mission', formData.mission, false),
              }}
              onFocus={() => setFocused('mission')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            {t('card.create_personality_optional', 'Kişilik kartı oluştur (Opsiyonel)')}
          </label>
          <PersonalityCard
            variant="editor"
            editorCardName={formData.personalityCardName}
            editorPrompt={formData.personalityCardPrompt}
            editorConfirmed={formData.personalityCardConfirmed}
            disabled={editMutation.isPending}
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
          <label style={labelStyle}>
            {t('card.personality_cards', 'KLANA ATANMIŞ KOLEKTİF KİŞİLİK KARTLARI')}
          </label>
          {tribe.personalityCards?.length > 0 ? (
            <CardSelectionSlots
              cards={tribe.personalityCards}
              selectedCardIds={selectedCardIds}
              onToggle={toggleCard}
              maxSelections={4}
              disabled={editMutation.isPending}
              showHeader={false}
              slotCount={tribe.personalityCards.length}
              tribeAssigned
              tribeBadgeLabel="KLAN"
            />
          ) : (
            <p className="text-muted" style={{ fontSize: 13 }}>
              {t('card.no_assigned_cards', 'Henüz klana kart atanmamış.')}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            {t(
              'bot.select_unassigned_cards',
              'Sahip olduğun kartlarından ekle (Opsiyonel)'
            )}
          </label>
          <CardSelectionSlots
            cards={myCards}
            selectedCardIds={selectedCardIds}
            onToggle={toggleCard}
            disabled={editMutation.isPending}
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
        <div style={{ marginTop: 16 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={editMutation.isPending}
            style={{
              width: '100%',
              padding: '13px 24px',
              fontSize: 14,
              fontWeight: 600,
              gap: 8,
              borderRadius: 12,
              opacity: !canSubmit ? 0.5 : 1,
              cursor: !canSubmit ? 'not-allowed' : 'pointer',
            }}
          >
            {editMutation.isPending ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('auth.processing')}
              </>
            ) : (
              <>{t('action.update', 'Güncelle')}</>
            )}
          </button>
        </div>
      </form>

      {/* Member Management */}
      <div style={{ marginTop: 48 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: 'var(--color-text-primary)',
              }}
            >
              {t('tribe_settings.member_management')}
            </h2>
          </div>
        </div>

        <div className="flex-col gap-2">
          {tribe.tribeMemberships?.map((member, index) =>
            member.actor ? (
              <div
                key={member.actor.actorId}
                className="lb-card flex items-center justify-between"
                style={{ padding: '8px 16px' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ActorMinimalCard actor={member.actor} />
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="badge"
                    style={{ background: 'var(--color-surface-raised)', marginRight: 8 }}
                  >
                    {member.roleName === 'TribeLeader'
                      ? t('tribe_settings.leader')
                      : member.roleName || t('tribe_settings.member')}
                  </span>

                  {member.actor.actorId !== currentUserId && (
                    <>
                      {member.roleName === 'Member' || !member.roleName ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          title={t('tribe_settings.make_moderator')}
                          onClick={() =>
                            rankMutation.mutate({
                              memberActorId: member.actor.actorId,
                              promotionType: 1,
                            })
                          }
                          disabled={rankMutation.isPending}
                        >
                          <Shield size={14} /> {t('tribe_settings.promote')}
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          title={t('tribe_settings.demote_desc')}
                          onClick={() =>
                            rankMutation.mutate({
                              memberActorId: member.actor.actorId,
                              promotionType: 2,
                            })
                          }
                          disabled={rankMutation.isPending}
                        >
                          <Shield size={14} /> {t('tribe_settings.demote')}
                        </button>
                      )}

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444' }}
                        title={t('tribe_settings.expel_desc')}
                        onClick={() => {
                          if (window.confirm(t('tribe_settings.confirm_expel'))) {
                            expelMutation.mutate(member.actor.actorId)
                          }
                        }}
                        disabled={expelMutation.isPending}
                      >
                        <UserMinus size={14} /> {t('tribe_settings.expel')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div
        style={{
          marginTop: 48,
          padding: '24px',
          borderRadius: 16,
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
            margin: '0 0 20px 0',
            lineHeight: 1.5,
          }}
        >
          {t('tribe_settings.danger_zone_desc')}
        </p>
        <button
          className="btn btn-primary"
          style={{
            background: '#ef4444',
            borderColor: '#ef4444',
            width: '100%',
            gap: 8,
            padding: '13px 24px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 12,
          }}
          onClick={handleDeleteTribe}
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={16} /> {t('tribe_settings.delete_tribe')}
        </button>
      </div>
    </div>
  )
}
