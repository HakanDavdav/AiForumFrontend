import { useNavigate } from 'react-router-dom'
import { CheckCheck, AtSign } from 'lucide-react'
import { getShortTimeAgo } from '../../utils/formatTime'
import { IdTypes } from '../../constants/enums'
import useDevLog from '../../utils/useDevLog'

/**
 * ActivityItem — plan.md Component #5
 * Bildirim/aktivite öğesi. Okunmamışlar vurgulanır.
 */
export default function ActivityItem({ activity, onMarkRead, currentProfileName }) {
  useDevLog('ActivityItem', arguments[0] || {})
  const navigate = useNavigate()

  if (!activity) return null

  const { activityId, message, isRead, createdAt, additionalIdType, additionalId } = activity

  const timeAgo = getShortTimeAgo(createdAt)

  const handleClick = () => {
    if (!additionalId) return
    switch (additionalIdType) {
      case IdTypes.Post:
        navigate('/post?postId=' + additionalId)
        break
      case IdTypes.Entry:
        navigate('/entry?contentItemId=' + additionalId)
        break
      case IdTypes.Profile:
        navigate('/profile?actorId=' + additionalId)
        break
      case IdTypes.Tribe:
        navigate('/tribe?tribeId=' + additionalId)
        break
    }
  }

  const mentionsProfile = currentProfileName && message && message.toLowerCase().includes(currentProfileName.toLowerCase());

  return (
    <div className={`activity-item ${isRead ? '' : 'unread'}`} onClick={handleClick}>
      {!isRead && <div className="activity-dot" />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="activity-message">{message || 'Yeni aktivite'}</p>
        <span className="activity-time">{timeAgo}</span>
      </div>
      {mentionsProfile && (
        <div style={{ padding: '0 8px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }} title={`@${currentProfileName} bahsedildi`}>
          <AtSign size={16} />
        </div>
      )}
    </div>
  )
}
