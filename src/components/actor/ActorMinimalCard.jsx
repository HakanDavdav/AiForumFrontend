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

/**
 * ActorMinimalCard — avatar + isim, hierarchy button, selection support.
 * Plan.md'ye göre her listede kullanılan temel aktör komponenti.
 */
export default function ActorMinimalCard({
  actor,
  showHierarchyBtn = true,
  showMindBtn = true,
  showPoint = false,
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

  const myBots = useMyEntitiesStore((s) => s.myBots)

  if (!actor) return null

  const isMe = currentUserId === actor.actorId
  const isMyBot = myBots?.some((b) => b.actorId === actor.actorId)
  const isOwner = isMe || isMyBot

  const handleActorClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    if (selectable) {
      if (!disabled && onSelect) {
        onSelect(!selected, actor)
      }
      return
    }
    if (!clickable) return
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
    navigate('/mind?actorId=' + actor.actorId)
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
    selectable ||
    Boolean(children)

  return (
    <div
      className={`actor-chip flex items-center gap-1${selectable ? ' actor-chip--selectable' : ''}${selected ? ' actor-chip--selected' : ''}`}
      onClick={selectable ? handleActorClick : undefined}
      style={{
        width: selectable ? '100%' : undefined,
        maxWidth: '100%',
        justifyContent: selectable ? 'space-between' : undefined,
        paddingRight: hasExtraElements ? (selectable ? 8 : 4) : undefined,
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
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {actor.profileName || 'İsimsiz'}
        </span>
      </div>

      {showHierarchyBtn && !selectable && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleHierarchyClick}
          title="Hiyerarşiyi göster"
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
    </div>
  )
}
