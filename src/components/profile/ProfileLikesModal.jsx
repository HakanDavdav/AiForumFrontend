import { useInfiniteQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import PostCard from '../content/PostCard'
import EntryCard from '../content/EntryCard'
import { ReactionEmojis } from '../../constants/enums'
import useAuthStore from '../../store/authStore'

export default function ProfileLikesModal({ actorId, isOpen, onClose }) {
  const { isLoggedIn, actorId: currentUserId } = useAuthStore()
  
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['profile-likes', actorId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await actorApi.getProfileLikes(actorId, pageParam)
      return {
        items: res.data?.data || [],
        nextPage: (res.data?.data?.length === 2) ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: isOpen && !!actorId,
  })

  // Bütün sayfaların içeriğini tek array'de topla
  const items = data?.pages?.flatMap(page => page.items) || []

  // Infinite scroll için onScroll handler
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }

  // Hiyerarşi zincirini oluşturma fonksiyonu (ContentItemPage'den uyarlandı)
  const buildParentChain = (entry) => {
    const chain = []
    let current = entry?.parentEntry
    while (current) {
      chain.unshift(current)
      current = current.parentEntry
    }
    return chain
  }

  const isOwner = (item) => isLoggedIn && item?.actor?.actorId === currentUserId

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-box" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 650, height: '80vh', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Reaksiyon Geçmişi</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div 
          style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}
          onScroll={handleScroll}
        >
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
                const entryChain = isEntry ? buildParentChain(like.entry) : []
                const rootPost = like.entry?.parentPost

                return (
                  <div key={like.likeId} className="card-surface flex flex-col gap-3" style={{ padding: 16 }}>
                    <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)' }}>
                        {isPost ? 'Ana konuya' : 'Bir yanıta'} {ReactionEmojis[like.reactionType]} attı
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {new Date(like.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    {isPost && (
                      <div>
                        <PostCard {...like.post} isOwner={isOwner(like.post)} />
                      </div>
                    )}

                    {isEntry && (
                      <div className="flex-col gap-2">
                        {/* Root Post */}
                        {rootPost && (
                          <div style={{ opacity: 0.7, transform: 'scale(0.95)', transformOrigin: 'top left' }}>
                            <PostCard {...rootPost} isOwner={isOwner(rootPost)} />
                          </div>
                        )}

                        {/* Parent Chain */}
                        {entryChain.length > 0 && (
                          <div className="flex-col" style={{ gap: 2, marginTop: 4 }}>
                            {entryChain.map((parentEntry, idx) => (
                              <div
                                key={parentEntry.contentItemId}
                                style={{
                                  marginLeft: (idx + 1) * 10,
                                  opacity: Math.max(0.5, 1 - idx * 0.15),
                                  borderLeft: '2px solid var(--color-border)',
                                  paddingLeft: 10,
                                  paddingTop: 2,
                                  paddingBottom: 2,
                                }}
                              >
                                <EntryCard {...parentEntry} depth={idx} isOwner={isOwner(parentEntry)} />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Odaklanan Entry */}
                        <div
                          style={{
                            marginLeft: (entryChain.length + 1) * 10,
                            marginTop: 8,
                            borderLeft: '3px solid var(--color-primary)',
                            borderRadius: '0 8px 8px 0',
                            background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
                            paddingLeft: 10,
                            paddingTop: 4,
                            paddingBottom: 4
                          }}
                        >
                          <EntryCard {...like.entry} depth={0} isOwner={isOwner(like.entry)} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {isFetchingNextPage && (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div className="spinner spinner-sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
