import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Pencil, Trash2, MessageSquare } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ActorChip from '../actor/ActorChip'
import ReactionButton from './ReactionButton'
import LikeListModal from './LikeListModal'
import EntryDraft from './EntryDraft'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

/**
 * EntryCard — plan.md Component #9
 * depth prop'u ile iç içe girinti desteği.
 * Reply butonu inline EntryDraft toggle'lar.
 */
export default function EntryCard({
  contentItemId,
  content,
  likeCount,
  entryCount,
  createdAt,
  actor,
  depth = 0,
  isOwner = false,
  onDelete,
  onEdit,
  queryKey,  // invalidation için
}) {
  const [showReplyDraft, setShowReplyDraft] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => contentItemApi.deleteEntry(contentItemId),
    onSuccess: () => {
      if (queryKey) queryClient.invalidateQueries(queryKey)
      if (onDelete) onDelete()
    },
  })

  const timeAgo = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: tr })
    : ''

  const depthClass = depth === 1 ? 'depth-1' : depth >= 2 ? 'depth-2' : ''

  return (
    <div className={`entry-card ${depthClass}`} style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Content */}
      <p className="entry-card-content">{content || '—'}</p>

      {/* Footer */}
      <div className="entry-card-footer">
        {/* Sol: Reaksiyon + yorum sayısı */}
        <div className="flex items-center gap-2">
          <ReactionButton contentItemId={contentItemId} likeCount={likeCount} />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowLikes(true)}
            title="Beğenenleri gör"
          >
            ❤ {likeCount ?? 0}
          </button>
          {isLoggedIn && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowReplyDraft((v) => !v)}
            >
              <MessageSquare size={13} />
              Cevapla
            </button>
          )}
        </div>

        {/* Sağ: ActorChip + zaman + owner actions */}
        <div className="flex items-center gap-2">
          <span className="text-muted">{timeAgo}</span>
          <ActorChip actor={actor} showHierarchyBtn={false} />
          {isOwner && (
            <div className="flex items-center gap-1">
              <button className="btn-icon" onClick={onEdit} title="Düzenle">
                <Pencil size={13} />
              </button>
              <button
                className="btn-icon"
                style={{ color: 'var(--color-error)' }}
                onClick={() => deleteMutation.mutate()}
                title="Sil"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Reply Draft */}
      {showReplyDraft && (
        <EntryDraft
          parentContentItemId={contentItemId}
          onSuccess={() => {
            setShowReplyDraft(false)
            if (queryKey) queryClient.invalidateQueries(queryKey)
          }}
          onCancel={() => setShowReplyDraft(false)}
        />
      )}

      {showLikes && (
        <LikeListModal
          contentItemId={contentItemId}
          isOpen={showLikes}
          onClose={() => setShowLikes(false)}
        />
      )}
    </div>
  )
}

// ─── EntryMinimalCard ─────────────────────────────────────────────────────────

export function EntryMinimalCard({ contentItemId, likeCount }) {
  const setCenterView = useUIStore((s) => s.setCenterView)
  return (
    <div
      className="post-minimal-card"
      onClick={() => setCenterView('entry', { contentItemId })}
    >
      <span className="post-minimal-title text-muted" style={{ fontStyle: 'italic' }}>
        #{contentItemId?.slice(0, 8)}
      </span>
      <span className="post-minimal-count">❤ {likeCount ?? 0}</span>
    </div>
  )
}
