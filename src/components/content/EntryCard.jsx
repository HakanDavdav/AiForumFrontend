import { useState } from 'react'
import { Pencil, Trash2, MessageSquare, Smile } from 'lucide-react'
import { getShortTimeAgo } from '../../utils/formatTime'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ReactionButton from './ReactionButton'
import LikeListModal from './LikeListModal'
import EntryDraft from './EntryDraft'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'

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
  queryKey, // invalidation için
  childEntries,
}) {
  useDevLog('EntryCard', arguments[0] || {})
  const [showReplyDraft, setShowReplyDraft] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const setCenterView = useUIStore((s) => s.setCenterView)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const loggedInActorId = useAuthStore((s) => s.actorId)
  const queryClient = useQueryClient()

  // Eğer mevcut childEntries prop'u boşsa ve entryCount > 0 ise dinamik getirme aktif olabilir
  const hasUnloadedChildren = entryCount > 0 && (!childEntries || childEntries.length === 0)

  const { data: fetchedChildEntriesRes, isLoading: isLoadingChildren } = useQuery({
    queryKey: ['entryEntries', contentItemId],
    queryFn: () => contentItemApi.getEntryEntries(contentItemId, 1, 1),
    enabled: isExpanded && hasUnloadedChildren,
  })

  const displayChildEntries = (childEntries && childEntries.length > 0) 
    ? childEntries 
    : (fetchedChildEntriesRes?.data?.data || [])

  const isOwnerInternal = isOwner || (loggedInActorId && actor?.actorId === loggedInActorId)

  const deleteMutation = useMutation({
    mutationFn: () => contentItemApi.deleteEntry(contentItemId),
    onSuccess: () => {
      if (queryKey) queryClient.invalidateQueries({ queryKey })
      if (onDelete) onDelete()
    },
  })

  const timeAgo = getShortTimeAgo(createdAt)

  // Maksimum 5 seviye derinliğe kadar CSS sınıfı atanır (depth-1, depth-2, ..., depth-5)
  const depthClass = depth > 0 ? (depth >= 5 ? 'depth-5' : `depth-${depth}`) : ''

  return (
    <>
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
            title="Reaksiyonları gör"
          >
            <Smile size={13} /> {likeCount ?? 0}
          </button>
          {isLoggedIn && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowReplyDraft((v) => !v)}>
              <MessageSquare size={13} />
              Cevapla
            </button>
          )}
        </div>

        {/* Sağ: ActorMinimalCard + zaman + owner actions */}
        <div className="flex items-center gap-2 hide-under-1200">
          <span className="text-muted">{timeAgo}</span>
          <ActorMinimalCard actor={actor} showHierarchyBtn={true} />
          {isOwnerInternal && (
            <div className="flex items-center gap-1">
              <button
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit ? onEdit() : setCenterView('edit-entry', { entryId: contentItemId })
                }}
                title="Düzenle"
              >
                <Pencil size={13} />
              </button>
              <button
                className="btn-icon"
                style={{ color: 'var(--color-error)' }}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteMutation.mutate()
                }}
                title="Sil"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {hasUnloadedChildren && (
        <div style={{ padding: '0 16px 12px 16px', marginTop: '-4px' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 13 }}
          >
            {isExpanded ? '- Yanıtları Gizle' : `+ Yanıtları Gör (${entryCount})`}
          </button>
          {isLoadingChildren && <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>Yükleniyor...</span>}
        </div>
      )}

      {/* Inline Reply Draft */}
      {showReplyDraft && (
        <EntryDraft
          parentContentItemId={contentItemId}
          onSuccess={() => {
            setShowReplyDraft(false)
            if (queryKey) queryClient.invalidateQueries({ queryKey })
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

      {displayChildEntries && displayChildEntries.length > 0 && (
        isExpanded || (childEntries && childEntries.length > 0) ? (
          displayChildEntries.map(child => (
            <EntryCard
              key={child.contentItemId}
              {...child}
              queryKey={queryKey}
            />
          ))
        ) : null
      )}
    </>
  )
}
