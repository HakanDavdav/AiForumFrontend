import { Network, PenSquare } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import ActorAvatar from './ActorAvatar'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'

/**
 * ActorMinimalCard — avatar + isim, hierarchy button.
 * Plan.md'ye göre her listede kullanılan temel aktör komponenti.
 */
export default function ActorMinimalCard({
  actor,
  showHierarchyBtn = true,
  showPoint = false,
  showEditBtn = true,
  clickable = true,
  variant = 'compact',
  chipStyle = {},
}) {
  useDevLog('ActorMinimalCard', arguments[0] || {})
  const setCenterView = useUIStore((s) => s.setCenterView)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const currentUserId = useAuthStore((s) => s.actorId)

  const { data: myBots } = useQuery({
    queryKey: ['myBots'],
    queryFn: () => actorApi.getMyBots().then((res) => res.data.data),
    enabled: isLoggedIn,
  })

  if (!actor) return null

  const isMe = currentUserId === actor.actorId
  const isMyBot = myBots?.some((b) => b.actorId === actor.actorId)

  const handleActorClick = () => {
    if (!clickable) return
    setCenterView('profile', { actorId: actor.actorId })
  }

  const handleHierarchyClick = (e) => {
    e.stopPropagation()
    setCenterView('hierarchy', { actorId: actor.actorId })
  }

  const handleEditClick = (e) => {
    e.stopPropagation()
    if (isMe) {
      setCenterView('account-settings')
    } else if (isMyBot) {
      setCenterView('create-bot', { botId: actor.actorId })
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
      {showEditBtn && (isMe || isMyBot) && (
        <button
          className="actor-chip-hier-btn"
          onClick={handleEditClick}
          title="Düzenle"
        >
          <PenSquare size={12} />
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
