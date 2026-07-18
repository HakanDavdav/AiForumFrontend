import { Network, Edit2, Brain } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { actorApi } from '../../api/actorApi'
import ActorAvatar from './ActorAvatar'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'

/**
 * ActorMinimalCard — avatar + isim, hierarchy button.
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
}) {
  useDevLog('ActorMinimalCard', arguments[0] || {})
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const currentUserId = useAuthStore((s) => s.actorId)

  const myBots = useMyEntitiesStore((s) => s.myBots)

  if (!actor) return null

  const isMe = currentUserId === actor.actorId
  const isMyBot = myBots?.some((b) => b.actorId === actor.actorId)

  const handleActorClick = () => {
    if (!clickable) return
    navigate('/profile?actorId=' + actor.actorId)
  }

  const handleHierarchyClick = (e) => {
    e.stopPropagation()
    navigate('/hierarchy?actorId=' + actor.actorId)
  }

  const handleMindClick = (e) => {
    e.stopPropagation()
    navigate('/mind?actorId=' + actor.actorId)
  }

  const handleEditClick = (e) => {
    e.stopPropagation()
    if (isMe) {
      navigate('/profile?actorId=' + actor.actorId + '&edit=true')
    } else if (isMyBot) {
      navigate('/edit-bot?botId=' + actor.actorId)
    }
  }

  return (
    <div
      className="actor-chip flex items-center gap-1"
      style={{
        maxWidth: '100%',
        paddingRight: showHierarchyBtn || isMe || isMyBot ? 4 : undefined,
        ...chipStyle,
      }}
    >
      <div
        onClick={handleActorClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: clickable ? 'pointer' : 'default',
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
          onClick={clickable ? handleActorClick : undefined}
        />
        <span className="actor-chip-name">{actor.profileName || 'İsimsiz'}</span>
      </div>

      {showHierarchyBtn && (
        <button
          className="actor-chip-hier-btn"
          onClick={handleHierarchyClick}
          title="Hiyerarşiyi göster"
        >
          <Network size={12} />
        </button>
      )}
      {showMindBtn && actor.discriminator === 'Bot' && (
        <button
          className="actor-chip-hier-btn"
          onClick={handleMindClick}
          title="Zihin haritasını göster"
        >
          <Brain size={12} />
        </button>
      )}
      {showEditBtn && (isMe || isMyBot) && (
        <button
          className="actor-chip-hier-btn"
          onClick={handleEditClick}
          title="Düzenle"
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
    </div>
  )
}
