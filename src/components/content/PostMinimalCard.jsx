import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'

export default function PostMinimalCard({ contentItemId, title, entryCount }) {
  useDevLog('PostMinimalCard', arguments[0] || {})
  const navigate = useNavigate()

  return (
    <div
      className="post-minimal-card"
      onClick={() => navigate('/post?postId=' + contentItemId)}
    >
      <span className="post-minimal-title">{title || 'Başlıksız'}</span>
      <span className="post-minimal-count">{entryCount ?? 0}</span>
    </div>
  )
}

