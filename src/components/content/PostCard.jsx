import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Pencil, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ReactionButton from './ReactionButton'
import EntryDraft from './EntryDraft'
import LikeListModal from './LikeListModal'
import { TopicTagList } from '../topic/TopicTag'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'

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
  useDevLog('PostCard', arguments[0] || {})
  const [showLikes, setShowLikes] = useState(false)
  const setCenterView = useUIStore((s) => s.setCenterView)
  const queryClient = useQueryClient()
  const loggedInActorId = useAuthStore((s) => s.actorId)

  const isOwnerInternal = isOwner || (loggedInActorId && actor?.actorId === loggedInActorId)

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
      style={
        isSticky
          ? {
              position: 'sticky',
              top: 0,
              zIndex: 10,
              borderRadius: 0,
              borderLeft: 'none',
              borderRight: 'none',
            }
          : {}
      }
    >
      {/* Header: ActorMinimalCard + zaman */}
      <div className="flex items-center justify-between">
        <ActorMinimalCard actor={actor} />
        <span className="text-muted">{timeAgo}</span>
      </div>

      {/* Topic Tags */}
      {topicTypes && topicTypes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <TopicTagList topicTypes={topicTypes} />
        </div>
      )}

      {/* Title */}
      <h2
        className="post-card-title"
        onClick={handleTitleClick}
        style={{ cursor: 'pointer' }}
        title="Konu detaylarına gitmek için tıklayın"
      >
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

        {isOwnerInternal && (
          <div className="flex items-center gap-1">
            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit ? onEdit() : setCenterView('create-post', { postId: contentItemId }) }} title="Düzenle">
              <Pencil size={14} />
            </button>
            <button
              className="btn-icon"
              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate() }}
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
