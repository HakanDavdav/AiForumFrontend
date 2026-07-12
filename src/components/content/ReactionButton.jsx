import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contentItemApi } from '../../api/contentItemApi'
import { ReactionType } from '../../constants/enums'
import { ThumbsUp, ThumbsDown, Skull, CirclePlus } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'

/**
 * ReactionButton — Like / Dislike / BrutallyDislike toggle grubu.
 * Optimistic UI: tıklanınca anında güncellenir, hata olursa geri döner.
 */
export default function ReactionButton({
  contentItemId,
  likeCount,
  dislikeCount,
  currentUserReaction = null, // ReactionType | null
  currentLikeId = null, // string | null — kaldırmak için gerekli
  onReactionChange, // (newReaction, newCount) => void
  onShowReactions, // (reactionType) => void
}) {
  useDevLog('ReactionButton', arguments[0] || {})
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const loggedInActorId = useAuthStore((s) => s.actorId)
  const queryClient = useQueryClient()

  const ReactionIcons = {
    [ReactionType.Like]: <ThumbsUp size={16} />,
    [ReactionType.Dislike]: <ThumbsDown size={16} />,
    [ReactionType.BrutallyDislike]: <Skull size={16} />,
  }

  const [optimisticReaction, setOptimisticReaction] = useState(currentUserReaction)
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(likeCount ?? 0)
  const [optimisticDislikeCount, setOptimisticDislikeCount] = useState(dislikeCount ?? 0)
  const [likeId, setLikeId] = useState(currentLikeId)
  const [animatingType, setAnimatingType] = useState(null)

  useEffect(() => {
    setOptimisticReaction(currentUserReaction)
    setLikeId(currentLikeId)
  }, [currentUserReaction, currentLikeId])

  useEffect(() => {
    setOptimisticLikeCount(likeCount ?? 0)
    setOptimisticDislikeCount(dislikeCount ?? 0)
  }, [likeCount, dislikeCount])

  const likeMutation = useMutation({
    mutationFn: ({ contentItemId, reactionType }) =>
      contentItemApi.like(contentItemId, reactionType),
    onSuccess: (res, variables) => {
      const newLikeId = res.data?.data?.likeId
      if (newLikeId) {
        setLikeId(newLikeId)
        if (loggedInActorId) {
          queryClient.setQueryData(['actorLike', contentItemId, loggedInActorId], {
            likeId: newLikeId,
            reactionType: variables.reactionType,
          })
        }
      }
    },
    onError: () => {
      // Geri al
      setOptimisticReaction(currentUserReaction)
      setOptimisticLikeCount(likeCount ?? 0)
      setOptimisticDislikeCount(dislikeCount ?? 0)
    },
  })

  const removeMutation = useMutation({
    mutationFn: ({ likeId, contentItemId }) => contentItemApi.removeLike(likeId, contentItemId),
    onSuccess: () => {
      setLikeId(null)
      if (loggedInActorId) {
        queryClient.setQueryData(['actorLike', contentItemId, loggedInActorId], null)
      }
    },
    onError: () => {
      setOptimisticReaction(currentUserReaction)
      setOptimisticLikeCount(likeCount ?? 0)
      setOptimisticDislikeCount(dislikeCount ?? 0)
    },
  })

  const decrementOldReaction = (oldReaction) => {
    if (oldReaction === ReactionType.Like) {
      setOptimisticLikeCount((c) => Math.max(0, c - 1))
    } else if (oldReaction === ReactionType.Dislike) {
      setOptimisticDislikeCount((c) => Math.max(0, c - 1))
    }
  }

  const incrementNewReaction = (newReaction) => {
    if (newReaction === ReactionType.Like) {
      setOptimisticLikeCount((c) => c + 1)
    } else if (newReaction === ReactionType.Dislike) {
      setOptimisticDislikeCount((c) => c + 1)
    }
  }

  const handleReact = async (reactionType) => {
    if (!isLoggedIn) return

    if (optimisticReaction === reactionType) {
      // Aynı reaksiyona tekrar tıklama → kaldır
      decrementOldReaction(optimisticReaction)
      setOptimisticReaction(null)
      if (likeId) await removeMutation.mutateAsync({ likeId, contentItemId })
    } else {
      // Yeni veya farklı reaksiyon
      if (optimisticReaction !== null) {
        decrementOldReaction(optimisticReaction)
        if (likeId) {
          try {
            await removeMutation.mutateAsync({ likeId, contentItemId })
          } catch (e) {
            console.error("Failed to remove old reaction", e)
          }
        }
      }

      incrementNewReaction(reactionType)
      setOptimisticReaction(reactionType)

      // Trigger animation
      setAnimatingType(reactionType)
      setTimeout(() => setAnimatingType(null), 500)

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
    <div
      className="reaction-group"
      style={{ display: 'flex', gap: 0, background: 'transparent', border: 'none', padding: 0 }}
    >
      {[ReactionType.Like, ReactionType.Dislike, ReactionType.BrutallyDislike].map(
        (type, index) => {
          let borderRadius = '0'
          if (index === 0) borderRadius = 'var(--radius-full) 0 0 var(--radius-full)'
          else if (index === 2) borderRadius = '0 var(--radius-full) var(--radius-full) 0'

          return (
            <div
              key={type}
              style={{
                position: 'relative',
                display: 'flex',
                marginLeft: index !== 0 ? '-1px' : 0,
              }}
            >
              <button
                className={`reaction-btn ${activeClass(type)} ${animatingType === type ? (type === ReactionType.BrutallyDislike ? 'animate-shake' : 'animate-pop') : ''}`}
                onClick={() => handleReact(type)}
                title={!isLoggedIn ? 'Beğenmek için giriş yapın' : undefined}
                disabled={!isLoggedIn}
                style={{
                  borderRadius,
                  position: 'relative',
                  zIndex: optimisticReaction === type ? 1 : 0,
                  minWidth: '35px',
                  justifyContent: 'center',
                }}
              >
                <span>{ReactionIcons[type]}</span>
                {type === ReactionType.Like && (
                  <span style={{ fontSize: '12px', position: 'relative', top: '-1px' }}>{optimisticLikeCount}</span>
                )}
                {type === ReactionType.Dislike && (
                  <span style={{ fontSize: '12px', position: 'relative', top: '-1px' }}>{optimisticDislikeCount}</span>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onShowReactions && onShowReactions(type)
                }}
                className="tiny-reaction-list-btn"
                title="Listeyi gör"
              >
                <CirclePlus size={14} />
              </button>
            </div>
          )
        }
      )}
    </div>
  )
}
