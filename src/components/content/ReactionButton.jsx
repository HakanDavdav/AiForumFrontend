import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { contentItemApi } from '../../api/contentItemApi'
import { ReactionType } from '../../constants/enums'
import { ThumbsUp, ThumbsDown, Skull } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'

/**
 * ReactionButton — Like / Dislike / BrutallyDislike toggle grubu.
 * Optimistic UI: tıklanınca anında güncellenir, hata olursa geri döner.
 */
export default function ReactionButton({
  contentItemId,
  likeCount,
  currentUserReaction = null,  // ReactionType | null
  currentLikeId = null,         // string | null — kaldırmak için gerekli
  onReactionChange,             // (newReaction, newCount) => void
}) {
  useDevLog('ReactionButton', arguments[0] || {})
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const ReactionIcons = {
    [ReactionType.Like]: <ThumbsUp size={16} />,
    [ReactionType.Dislike]: <ThumbsDown size={16} />,
    [ReactionType.BrutallyDislike]: <Skull size={16} />,
  }

  const [optimisticReaction, setOptimisticReaction] = useState(currentUserReaction)
  const [optimisticCount, setOptimisticCount] = useState(likeCount ?? 0)
  const [likeId, setLikeId] = useState(currentLikeId)

  useEffect(() => {
    setOptimisticReaction(currentUserReaction)
    setOptimisticCount(likeCount ?? 0)
    setLikeId(currentLikeId)
  }, [currentUserReaction, likeCount, currentLikeId])

  const likeMutation = useMutation({
    mutationFn: ({ contentItemId, reactionType }) =>
      contentItemApi.like(contentItemId, reactionType),
    onSuccess: (res) => {
      const newLikeId = res.data?.data?.likeId
      if (newLikeId) setLikeId(newLikeId)
    },
    onError: () => {
      // Geri al
      setOptimisticReaction(currentUserReaction)
      setOptimisticCount(likeCount ?? 0)
    },
  })

  const removeMutation = useMutation({
    mutationFn: ({ likeId, contentItemId }) =>
      contentItemApi.removeLike(likeId, contentItemId),
    onSuccess: () => setLikeId(null),
    onError: () => {
      setOptimisticReaction(currentUserReaction)
      setOptimisticCount(likeCount ?? 0)
    },
  })

  const handleReact = (reactionType) => {
    if (!isLoggedIn) return

    if (optimisticReaction === reactionType) {
      // Aynı reaksiyona tekrar tıklama → kaldır
      setOptimisticReaction(null)
      setOptimisticCount((c) => Math.max(0, c - 1))
      if (likeId) removeMutation.mutate({ likeId, contentItemId })
    } else {
      // Yeni veya farklı reaksiyon
      const wasReacted = optimisticReaction !== null
      setOptimisticReaction(reactionType)
      if (!wasReacted) setOptimisticCount((c) => c + 1)
      if (likeId) {
        // Önce eskiyi kaldır
        removeMutation.mutate({ likeId, contentItemId })
      }
      likeMutation.mutate({ contentItemId, reactionType })
    }
  }

  const activeClass = (type) => {
    if (optimisticReaction !== type) return ''
    if (type === ReactionType.Like) return 'active-like'
    if (type === ReactionType.Dislike) return 'active-dislike'
    return 'active-brutal'
  }

  return (
    <div className="reaction-group">
      {[ReactionType.Like, ReactionType.Dislike, ReactionType.BrutallyDislike].map((type) => (
        <button
          key={type}
          className={`reaction-btn ${activeClass(type)}`}
          onClick={() => handleReact(type)}
          title={!isLoggedIn ? 'Beğenmek için giriş yapın' : undefined}
          disabled={!isLoggedIn}
        >
          <span>{ReactionIcons[type]}</span>
          {type === ReactionType.Like && (
            <span style={{ fontSize: '12px' }}>{optimisticCount}</span>
          )}
        </button>
      ))}
    </div>
  )
}
