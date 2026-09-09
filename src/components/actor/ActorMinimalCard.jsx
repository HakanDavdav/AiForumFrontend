import { useState, useMemo } from 'react'
import { Network, Edit2, Brain } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { actorApi } from '../../api/actorApi'
import ActorAvatar from './ActorAvatar'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import SelectionMarker from '../common/SelectionMarker'
import PremiumModal from '../common/PremiumModal'
import ModifierArrowSvg from '../../assets/FigmaNew/modifierarrow.svg?react'
import CardIcon from '../common/icons/CardIcon'

/**
 * ActorMinimalCard — avatar + isim, hierarchy button, selection support.
 * Plan.md'ye göre her listede kullanılan temel aktör komponenti.
 */
export default function ActorMinimalCard({
  actor,
  showHierarchyBtn = true,
  showMindBtn = true,
  showPoint = false,
  showJuryPoints = false,
  juryProponentScore = null,
  juryOpponentScore = null,
  showEditBtn = true,
  clickable = true,
  variant = 'compact',
  chipStyle = {},
  selectable = false,
  selected = false,
  onSelect,
  disabled = false,
  children,
}) {
  useDevLog('ActorMinimalCard', arguments[0] || {})
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const currentUserId = useAuthStore((s) => s.actorId)
  const [isPremiumOpen, setIsPremiumOpen] = useState(false)

  const myBots = useMyEntitiesStore((s) => s.myBots)
  const myCards = useMyEntitiesStore((s) => s.myCards)

  // Matching personality cards between current actor and logged-in user
  const matchingCardsCount = useMemo(() => {
    if (!isLoggedIn || !myCards?.length || !actor) return 0

    const rawAssigned = [
      ...(actor.assignedCardIds || actor.AssignedCardIds || []),
      ...(actor.assignedCards || actor.AssignedCards || []).map((c) => c?.cardId || c?.CardId || c),
    ]
    if (!rawAssigned.length) return 0

    const assignedIds = rawAssigned
      .map((c) => (typeof c === 'string' ? c : c?.cardId || c?.CardId || c?.id || c?.Id))
      .filter(Boolean)

    if (!assignedIds.length) return 0

    const myCardIds = myCards
      .map((c) => (typeof c === 'string' ? c : c?.cardId || c?.CardId || c?.id || c?.Id))
      .filter(Boolean)

    if (!myCardIds.length) return 0

    const matches = assignedIds.filter((aId) =>
      myCardIds.some((mId) => mId.toLowerCase() === aId.toLowerCase())
    )
    return matches.length
  }, [isLoggedIn, myCards, actor])

  const visibleCardsCount = Math.min(matchingCardsCount, 5)

  if (!actor) return null

  const isMe = currentUserId === actor.actorId
  const isMyBot = myBots?.some((b) => b.actorId === actor.actorId)
  const isOwner = isMe || isMyBot

  const pScore = juryProponentScore ?? actor?.proponentScore ?? actor?.juryProponentScore ?? null
  const oScore = juryOpponentScore ?? actor?.opponentScore ?? actor?.juryOpponentScore ?? null
  const hasJuryScores = pScore !== null && oScore !== null
  const isPropLeading = hasJuryScores && pScore >= oScore
  const isOppLeading = hasJuryScores && oScore >= pScore

  const handleActorClick = (e) => {
    if (selectable) {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation()
      }
      if (!disabled && onSelect) {
        onSelect(!selected, actor)
      }
      return
    }
    if (!clickable) return
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    navigate('/profile?actorId=' + actor.actorId)
  }

  const handleHierarchyClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate('/hierarchy?actorId=' + actor.actorId)
  }

  const handleMindClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate('/mind?actorId=' + actor.actorId, { state: { profileName: actor.profileName } })
  }

  const handleEditClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isMe) {
      navigate('/profile?actorId=' + actor.actorId + '&edit=true')
    } else if (isMyBot) {
      navigate('/edit-bot?botId=' + actor.actorId)
    }
  }

  const hasExtraElements =
    (showHierarchyBtn && !selectable) ||
    (showMindBtn && !selectable && actor.discriminator === 'Bot') ||
    (showEditBtn && !selectable && isOwner) ||
    (showPoint && actor.actorPoint != null) ||
    showJuryPoints ||
    selectable ||
    Boolean(children)

  const chipContent = (
    <div
      className={`actor-chip flex items-center gap-1${selectable ? ' actor-chip--selectable' : ''}${selected ? ' actor-chip--selected' : ''}`}
      onClick={selectable ? handleActorClick : undefined}
      style={{
        position: 'relative',
        zIndex: 2,
        width: selectable ? '100%' : undefined,
        maxWidth: '100%',
        justifyContent: selectable ? 'space-between' : undefined,
        paddingRight: selectable ? 12 : 10,
        paddingLeft: selectable ? 6 : undefined,
        cursor: selectable ? (disabled ? 'not-allowed' : 'pointer') : undefined,
        border: selectable && selected ? '1.5px solid var(--color-primary)' : undefined,
        background:
          selectable && selected
            ? 'color-mix(in srgb, var(--color-primary) 14%, var(--color-surface) 86%)'
            : undefined,
        userSelect: selectable ? 'none' : undefined,
        transition: 'all 0.15s ease',
        ...chipStyle,
      }}
    >
      <div
        onClick={selectable ? undefined : handleActorClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: clickable || selectable ? 'pointer' : 'default',
          flex: 1,
          minWidth: 0,
          marginRight: hasExtraElements || matchingCardsCount > 0 ? 15 : 0,
        }}
      >
        <ActorAvatar
          profileName={actor.profileName}
          imageUrl={actor.imageUrl}
          discriminator={actor.discriminator}
          actorId={actor.actorId}
          size={variant === 'expanded' ? 'md' : 'sm'}
          onClick={clickable && !selectable ? (actorId, e) => handleActorClick(e) : undefined}
        />
        <span
          className="actor-chip-name"
          style={{
            display: 'block',
            minWidth: 0,
            maxWidth: '14ch',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {actor.profileName || t('actor.unnamed', 'İsimsiz')}
        </span>
      </div>

      {showHierarchyBtn && !selectable && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleHierarchyClick}
          title={t('actor.show_hierarchy', 'Hiyerarşiyi göster')}
        >
          <Network size={12} />
        </button>
      )}
      {showMindBtn && !selectable && actor.discriminator === 'Bot' && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleMindClick}
          title={t('mind.show')}
        >
          <Brain size={12} />
        </button>
      )}
      {showEditBtn && !selectable && isOwner && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleEditClick}
          title={t('action.edit')}
        >
          <Edit2 size={12} />
        </button>
      )}
      {showEditBtn && !selectable && isOwner && (
        <button
          type="button"
          className="actor-chip-premium-btn"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsPremiumOpen(true)
          }}
          title={t('premium.title', 'Premium')}
        >
          <ModifierArrowSvg
            width={16}
            height={22}
            style={{ display: 'block' }}
          />
        </button>
      )}
      {showPoint && actor.actorPoint != null && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-surface-2)',
            padding: '2px 6px',
            borderRadius: 12,
          }}
        >
          {actor.actorPoint} P
        </span>
      )}
      {showJuryPoints && (
        <div
          className="actor-chip-jury-scores"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          {hasJuryScores ? (
            <>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isPropLeading ? 800 : 600,
                  color: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  border: isPropLeading ? '1px solid #3b82f6' : '1px solid transparent',
                  lineHeight: '14px',
                }}
                title={`Proponent: ${pScore}`}
              >
                P:{pScore}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isOppLeading ? 800 : 600,
                  color: '#ec4899',
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  border: isOppLeading ? '1px solid #ec4899' : '1px solid transparent',
                  lineHeight: '14px',
                }}
                title={`Opponent: ${oScore}`}
              >
                O:{oScore}
              </span>
            </>
          ) : (
            <span
              style={{
                fontSize: 9,
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
                padding: '0 4px',
              }}
            >
              ...
            </span>
          )}
        </div>
      )}
      {selectable && (
        <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <SelectionMarker
            checked={selected}
            size="sm"
            disabled={disabled}
            label={actor.profileName}
          />
        </div>
      )}
      {children}
      {matchingCardsCount > 0 && (
        <div
          className="actor-chip-card-stack"
          title={t('card.matching_cards_assigned', {
            count: matchingCardsCount,
            defaultValue: `${matchingCardsCount} adet kişisel kartınız bu botta takılı`,
          })}
          onClick={clickable && !selectable ? handleActorClick : undefined}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            flexShrink: 0,
            marginLeft: 8,
            cursor: clickable && !selectable ? 'pointer' : 'default',
            pointerEvents: clickable && !selectable ? 'auto' : 'none',
          }}
        >
          {Array.from({ length: visibleCardsCount }).map((_, idx) => (
            <span
              key={idx}
              className="actor-chip-card-item"
              style={{
                position: 'relative',
                marginLeft: idx === 0 ? 0 : -10,
                zIndex: idx + 1,
              }}
            >
              <CardIcon crowned width={21} height={24} style={{ display: 'block' }} />
            </span>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      {matchingCardsCount > 0 ? (
        <div
          className={`actor-chip-wrapper${selectable ? ' actor-chip-wrapper--selectable' : ''}`}
          style={{
            position: 'relative',
            display: selectable || chipStyle?.width === '100%' ? 'flex' : 'inline-flex',
            alignItems: 'center',
            verticalAlign: 'middle',
            maxWidth: chipStyle?.maxWidth || '100%',
            width: selectable || chipStyle?.width === '100%' ? '100%' : (chipStyle?.width || undefined),
            minWidth: chipStyle?.minWidth || undefined,
            flexShrink: chipStyle?.flexShrink !== undefined ? chipStyle.flexShrink : undefined,
            flex: chipStyle?.flex !== undefined ? chipStyle.flex : undefined,
          }}
        >
          {chipContent}
        </div>
      ) : (
        chipContent
      )}
      <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />
    </>
  )
}
