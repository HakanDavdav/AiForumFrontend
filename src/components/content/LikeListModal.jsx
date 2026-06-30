import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { contentItemApi } from '../../api/contentItemApi'
import ActorChip from '../actor/ActorChip'
import { ReactionEmojis } from '../../constants/enums'

/**
 * LikeListModal — plan.md Component #17
 * İçeriği beğenenlerin listesi, paginated.
 */
export default function LikeListModal({ contentItemId, isOpen, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['likes', contentItemId],
    queryFn: () => contentItemApi.getContentItemLikes(contentItemId),
    enabled: isOpen && !!contentItemId,
    select: (res) => res.data?.data || [],
  })

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Beğenenler</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="spinner spinner-md" />
          </div>
        ) : data?.length === 0 ? (
          <p className="empty-state">Henüz beğeni yok</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data?.map((like) => (
              <div key={like.likeId} className="flex items-center justify-between">
                <ActorChip actor={like.actor} showHierarchyBtn={false} />
                <span style={{ fontSize: 18 }}>{ReactionEmojis[like.reactionType]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
