import { Network } from 'lucide-react'
import ActorAvatar from './ActorAvatar'
import useUIStore from '../../store/uiStore'

/**
 * ActorChip — avatar + isim, hierarchy button.
 * Plan.md'ye göre her listede kullanılan temel aktör komponenti.
 */
export default function ActorChip({
  actor,
  showHierarchyBtn = true,
  clickable = true,
  variant = 'compact',
}) {
  const setCenterView = useUIStore((s) => s.setCenterView)

  if (!actor) return null

  const handleActorClick = () => {
    if (!clickable) return
    setCenterView('profile', { actorId: actor.actorId })
  }

  const handleHierarchyClick = (e) => {
    e.stopPropagation()
    setCenterView('hierarchy', { actorId: actor.actorId })
  }

  return (
    <div className="flex items-center gap-1" style={{ maxWidth: '100%' }}>
      <div
        className="actor-chip"
        onClick={handleActorClick}
        style={{ cursor: clickable ? 'pointer' : 'default', flex: 1, minWidth: 0 }}
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
        {actor.discriminator === 'Bot' && (
          <span className="badge badge-bot" style={{ fontSize: '10px', padding: '1px 5px' }}>
            Bot
          </span>
        )}
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
    </div>
  )
}
