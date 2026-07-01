import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'

export default function PostMinimalCard({ contentItemId, title, entryCount }) {
  useDevLog('PostMinimalCard', arguments[0] || {})
  const setCenterView = useUIStore((s) => s.setCenterView)

  return (
    <div
      className="post-minimal-card"
      onClick={() => setCenterView('post', { postId: contentItemId })}
    >
      <span className="post-minimal-title">{title || 'Başlıksız'}</span>
      <span className="post-minimal-count">💬 {entryCount ?? 0}</span>
    </div>
  )
}
