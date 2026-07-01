import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CheckCheck } from 'lucide-react'
import { IdTypes } from '../../constants/enums'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'

/**
 * ActivityItem — plan.md Component #5
 * Bildirim/aktivite öğesi. Okunmamışlar vurgulanır.
 */
export default function ActivityItem({ activity, onMarkRead }) {
  useDevLog('ActivityItem', arguments[0] || {})
  const setCenterView = useUIStore((s) => s.setCenterView)

  if (!activity) return null

  const {
    activityId,
    message,
    isRead,
    createdAt,
    additionalIdType,
    additionalId,
  } = activity

  const timeAgo = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: tr })
    : ''

  const handleClick = () => {
    if (!isRead && onMarkRead) onMarkRead(activityId)

    if (!additionalId) return
    switch (additionalIdType) {
      case IdTypes.Post:
        setCenterView('post', { postId: additionalId })
        break
      case IdTypes.Entry:
        setCenterView('entry', { contentItemId: additionalId })
        break
      case IdTypes.Profile:
        setCenterView('profile', { actorId: additionalId })
        break
      case IdTypes.Tribe:
        setCenterView('tribe', { tribeId: additionalId })
        break
    }
  }

  return (
    <div className={`activity-item ${isRead ? '' : 'unread'}`} onClick={handleClick}>
      {!isRead && <div className="activity-dot" />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="activity-message">{message || 'Yeni aktivite'}</p>
        <span className="activity-time">{timeAgo}</span>
      </div>
      {!isRead && onMarkRead && (
        <button
          className="btn-icon"
          title="Okundu işaretle"
          onClick={(e) => { e.stopPropagation(); onMarkRead(activityId) }}
        >
          <CheckCheck size={14} style={{ color: 'var(--color-primary)' }} />
        </button>
      )}
    </div>
  )
}
