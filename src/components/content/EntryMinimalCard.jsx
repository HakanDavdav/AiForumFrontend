import useUIStore from '../../store/uiStore'

export default function EntryMinimalCard({ contentItemId, title, likeCount }) {
  const setCenterView = useUIStore((s) => s.setCenterView)
  return (
    <div
      className="post-minimal-card"
      onClick={() => setCenterView('entry', { contentItemId })}
    >
      <span className="post-minimal-title">
        {title || `#${contentItemId?.slice(0, 8)}`}
      </span>
      <span className="post-minimal-count">❤ {likeCount ?? 0}</span>
    </div>
  )
}
