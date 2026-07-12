import { useInfiniteQuery } from '@tanstack/react-query'
import { X, ThumbsUp, ThumbsDown, Skull } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import PostCard from '../content/PostCard'
import ContextualEntryThread from '../content/ContextualEntryThread'
import { ReactionEmojis, ReactionType } from '../../constants/enums'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'

export default function ProfileLikesModal({ actorId, isOpen, onClose }) {
  useDevLog('ProfileLikesModal', arguments[0] || {})
  const { isLoggedIn, actorId: currentUserId } = useAuthStore()

  const ReactionIcons = {
    [ReactionType.Like]: <ThumbsUp size={14} />,
    [ReactionType.Dislike]: <ThumbsDown size={14} />,
    [ReactionType.BrutallyDislike]: <Skull size={14} />,
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['profile-likes', actorId],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res = await actorApi.getProfileLikes(actorId, pageParam)
        return {
          items: res.data?.data || [],
          nextPage: res.data?.data?.length === 2 ? pageParam + 1 : undefined,
        }
      } catch (err) {
        return { items: [], nextPage: undefined }
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: isOpen && !!actorId,
  })

  // Bütün sayfaların içeriğini tek array'de topla
  const items = data?.pages?.flatMap((page) => page.items) || []

  // Infinite scroll için onScroll handler
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }

  const isOwner = (item) => isLoggedIn && item?.actor?.actorId === currentUserId

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 800,
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Reaksiyon Geçmişi</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }} onScroll={handleScroll}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div className="spinner spinner-md" />
            </div>
          ) : items.length === 0 ? (
            <p className="empty-state">Henüz bir reaksiyon vermemiş.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((like) => {
                const isPost = !!like.post
                const isEntry = !!like.entry

                return (
                  <div
                    key={like.likeId}
                    className="card-surface flex flex-col gap-3"
                    style={{ padding: 16 }}
                  >
                    <div
                      className="flex items-center justify-between"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        paddingBottom: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isPost ? 'Ana konuya' : 'Bir yanıta'} {ReactionIcons[like.reactionType]}{' '}
                        attı
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {new Date(like.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    {isPost && (
                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--color-primary)',
                            marginBottom: 6,
                            paddingLeft: 4,
                          }}
                        >
                          ODAKLANAN KONU
                        </p>
                        <div
                          style={{
                            borderLeft: '3px solid var(--color-primary)',
                            borderRadius: '0 8px 8px 0',
                            background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
                            paddingLeft: 12,
                          }}
                        >
                          <PostCard {...like.post} isOwner={isOwner(like.post)} />
                        </div>
                      </div>
                    )}

                    {isEntry && <ContextualEntryThread entryDto={like.entry} hideCardStyle />}
                  </div>
                )
              })}

              {isFetchingNextPage && (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div className="spinner spinner-sm" />
                </div>
              )}
              {!isFetchingNextPage && !hasNextPage && items.length > 0 && (
                <p
                  className="text-muted"
                  style={{ padding: 16, textAlign: 'center', fontSize: 13 }}
                >
                  Son
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
