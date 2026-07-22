import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getShortTimeAgo } from '../../utils/formatTime'
import { Pencil, Trash2, MessageSquare, ChevronDown, ChevronUp, Smile } from 'lucide-react'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import ReactionButton from './ReactionButton'
import EntryDraft from './EntryDraft'
import LikeListModal from './LikeListModal'
import { TopicTagList } from '../topic/TopicTag'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

/**
 * PostCard — tam post görünümü (PostDto'dan).
 * Sticky kullanım için plan.md'e uygun.
 */
export default function PostCard({
  contentItemId,
  title,
  content,
  likeCount,
  dislikeCount,
  entryCount,
  createdAt,
  updatedAt,
  topicTypes,
  actor,
  tribe,
  isOwner = false,
  isSticky = false,
  onDelete,
  onEdit,
}) {
  useDevLog('PostCard', arguments[0] || {})
  const [showLikes, setShowLikes] = useState(false)
  const [activeLikesTab, setActiveLikesTab] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const loggedInActorId = useAuthStore((s) => s.actorId)
  const { t } = useTranslation()

  const isDeletedPost = title === '[Deleted]' && content === '[Deleted]'
  const isOwnerInternal = !isDeletedPost && (isOwner || (loggedInActorId && actor?.actorId === loggedInActorId))

  // --- Start ActorLike Query ---
  const { data: actorLike } = useQuery({
    queryKey: ['actorLike', contentItemId, loggedInActorId],
    queryFn: () =>
      contentItemApi.getActorLike(contentItemId, loggedInActorId)
        .then((r) => r.data?.data)
        .catch(() => null),
    enabled: isLoggedIn && !!loggedInActorId,
    retry: false,
  })
  // --- End ActorLike Query ---

  const deleteMutation = useMutation({
    mutationFn: () => contentItemApi.deletePost(contentItemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed'])
      if (onDelete) onDelete()
    },
  })

  const timeAgo = getShortTimeAgo(createdAt)

  const handleTitleClick = () => {
    navigate('/post?postId=' + contentItemId)
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
      {/* Header: ActorMinimalCard + tribe badge + zaman */}
      <div className="flex items-start" style={{ flexWrap: 'wrap', gap: '6px' }}>
        <div className="flex items-center" style={{ gap: 6 }}>
          {actor ? (
            <ActorMinimalCard actor={actor} />
          ) : (
            <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              {t('card.deleted_user')}
            </span>
          )}
          {tribe && (
            <>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>›</span>
              <TribeMinimalCard {...tribe} showPoint={false} showMindBtn={false} showEditBtn={false} />
            </>
          )}
        </div>
        <span className="text-muted" style={{ marginLeft: 'auto' }}>{timeAgo}</span>
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
        title="Başlık detaylarına gitmek için tıklayın"
      >
        {title || 'Başlıksız'}
      </h2>

      {/* Content */}
      {content && <p className="post-card-content">{content}</p>}

      {/* Footer */}
      <div className="post-card-footer">
        <div className="flex items-center gap-2">
          <ReactionButton
            contentItemId={contentItemId}
            likeCount={likeCount}
            dislikeCount={dislikeCount}
            currentUserReaction={actorLike?.reactionType}
            currentLikeId={actorLike?.likeId}
            onShowReactions={(type) => {
              setActiveLikesTab(type)
              setShowLikes(true)
            }}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/post?postId=' + contentItemId)}
          >
            <MessageSquare size={14} />
            {entryCount ?? 0} {t('post.comments')}
          </button>
        </div>

        {isOwnerInternal && (
          <div className="flex items-center gap-1">
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation()
                onEdit ? onEdit() : navigate('/edit-post?postId=' + contentItemId)
              }}
              title={t('action.edit')}
            >
              <Pencil size={14} />
            </button>
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation()
                deleteMutation.mutate()
              }}
              title={t('action.delete')}
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
          initialTab={activeLikesTab}
        />
      )}
    </article>
  )
}
