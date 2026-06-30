import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Pencil, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import ActorChip from '../actor/ActorChip'
import ReactionButton from './ReactionButton'
import EntryDraft from './EntryDraft'
import LikeListModal from './LikeListModal'
import { TopicTagList } from '../topic/TopicTag'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

/**
 * PostCard — tam post görünümü (PostDto'dan).
 * Sticky kullanım için plan.md'e uygun.
 */
export default function PostCard({
  contentItemId,
  title,
  content,
  likeCount,
  entryCount,
  createdAt,
  updatedAt,
  topicTypes,
  actor,
  isOwner = false,
  isSticky = false,
  onDelete,
  onEdit,
}) {
  const [showLikes, setShowLikes] = useState(false)
  const setCenterView = useUIStore((s) => s.setCenterView)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => contentItemApi.deletePost(contentItemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed'])
      if (onDelete) onDelete()
    },
  })

  const timeAgo = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: tr })
    : ''

  const handleTitleClick = () => {
    setCenterView('post', { postId: contentItemId })
  }

  return (
    <article
      className="post-card"
      style={isSticky ? { position: 'sticky', top: 0, zIndex: 10, borderRadius: 0, borderLeft: 'none', borderRight: 'none' } : {}}
    >
      {/* Header: ActorChip + zaman */}
      <div className="flex items-center justify-between">
        <ActorChip actor={actor} />
        <span className="text-muted">{timeAgo}</span>
      </div>

      {/* Topic Tags */}
      {topicTypes && topicTypes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <TopicTagList topicTypes={topicTypes} />
        </div>
      )}

      {/* Title */}
      <h2 className="post-card-title" onClick={handleTitleClick}>
        {title || 'Başlıksız'}
      </h2>

      {/* Content */}
      {content && <p className="post-card-content">{content}</p>}

      {/* Footer */}
      <div className="post-card-footer">
        <div className="flex items-center gap-2">
          <ReactionButton contentItemId={contentItemId} likeCount={likeCount} />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setCenterView('post', { postId: contentItemId })}
          >
            <MessageSquare size={14} />
            {entryCount ?? 0} yorum
          </button>
        </div>

        {isOwner && (
          <div className="flex items-center gap-1">
            <button className="btn-icon" onClick={onEdit} title="Düzenle">
              <Pencil size={14} />
            </button>
            <button
              className="btn-icon"
              onClick={() => deleteMutation.mutate()}
              title="Sil"
              style={{ color: 'var(--color-error)' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {showLikes && (
        <LikeListModal
          contentItemId={contentItemId}
          isOpen={showLikes}
          onClose={() => setShowLikes(false)}
        />
      )}
    </article>
  )
}

// ─── PostMinimalCard ──────────────────────────────────────────────────────────

export function PostMinimalCard({ contentItemId, title, entryCount }) {
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
