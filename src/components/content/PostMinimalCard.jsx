import useUIStore from '../../store/uiStore'

export default function PostMinimalCard({ contentItemId, title, entryCount }) {
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
