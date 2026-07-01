import { useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'

export default function FollowListModal({ actorId, type, isOpen, onClose }) {
  // type is 'followers' or 'following'
  
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['follow-list', actorId, type],
    queryFn: async ({ pageParam = 1 }) => {
      const res = type === 'followers'
        ? await actorApi.getProfileFollowers(actorId, pageParam)
        : await actorApi.getProfileFollowing(actorId, pageParam)
      return {
        items: res.data?.data || [],
        nextPage: (res.data?.data?.length === 10) ? pageParam + 1 : undefined,
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

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-box" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 400, height: '60vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>
            {type === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
          </h3>
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
            <p className="empty-state">Henüz kimse yok.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((actor) => (
                <div key={actor.actorId} className="card-surface" style={{ padding: 12 }}>
                  <ActorMinimalCard actor={actor} showHierarchyBtn={false} clickable={true} />
                </div>
              ))}
              
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
