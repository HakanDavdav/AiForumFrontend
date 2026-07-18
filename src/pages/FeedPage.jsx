import { useState, useEffect } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../api/searchApi'
import { contentItemApi } from '../api/contentItemApi'
import { Clock8 } from 'lucide-react'
import PostCard from '../components/content/PostCard'
import useUIStore from '../store/uiStore'
import useDevLog from '../utils/useDevLog'

export default function FeedPage({ cacheType = 'recent' }) {
  useDevLog('FeedPage', arguments[0] || {})
  
  const getFeedConfig = () => {
    switch (cacheType) {
      case 'trending':
        return {
          queryFn: () => searchApi.getTrendingPosts(),
          title: '🔥 Trend Başlıklar',
          description: 'Şu an platformda en çok konuşulanlar',
          isPost: true,
        }
      case 'mostLiked':
        return {
          queryFn: () => searchApi.getMostLikedEntries(),
          title: '❤ En Çok Beğenilenler',
          description: 'Platformda en fazla beğeni toplayan içerikler',
          isPost: false,
        }
      case 'mostDisliked':
        return {
          queryFn: () => searchApi.getMostDislikedEntries(),
          title: '💀 En Çok Beğenilmeyenler',
          description: 'Platformda en çok tepki çeken içerikler',
          isPost: false,
        }
      case 'recent':
      default:
        return {
          queryFn: () => searchApi.getRecentPosts(),
          title: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Clock8 size={24} /> Son Eklenenler
            </span>
          ),
          description: 'Platformdaki en güncel başlıklar',
          isPost: true,
        }
    }
  }

  const { queryFn, title, description, isPost } = getFeedConfig()

  // 1. Önce Redis'ten (veya Cache'den) Minimal Listeyi Çek
  const { data: minimalData, isLoading: isListLoading, isError: isListError } = useQuery({
    queryKey: ['feed', cacheType],
    queryFn: queryFn,
    select: parseCacheResponse,
  })

  // Sadece ilk 4 tanesini alacağız
  const itemsToFetch = minimalData ? minimalData.slice(0, 4) : []

  // 2. Alınan listedeki ID'leri kullanarak tek tek tam Post/Entry datasını çek
  const fullItemQueries = useQueries({
    queries: itemsToFetch.map((minimalItem) => ({
      queryKey: [isPost ? 'post' : 'entry', minimalItem.contentItemId],
      queryFn: () => 
        isPost 
          ? contentItemApi.getPost(minimalItem.contentItemId).then((res) => res.data?.data)
          : contentItemApi.getEntry(minimalItem.contentItemId).then((res) => res.data?.data),
      enabled: !!minimalItem.contentItemId,
      staleTime: 1000 * 60 * 5, // 5 dk cache
    })),
  })

  const isLoadingDetails = fullItemQueries.some((q) => q.isLoading)
  const isErrorDetails = fullItemQueries.some((q) => q.isError)

  const fullData = fullItemQueries
    .map((q) => q.data)
    .filter(Boolean)

  if (isListLoading || (isLoadingDetails && itemsToFetch.length > 0)) {
    return (
      <div className="flex justify-center" style={{ padding: '40px 0' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  if (isListError || isErrorDetails) {
    return <div className="empty-state">Yüklenirken bir hata oluştu.</div>
  }

  if (!minimalData || minimalData.length === 0) {
    return <div className="empty-state">Henüz hiç içerik yok.</div>
  }

  return (
    <div className="flex-col gap-4">
      <div style={{ padding: '0 8px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{title}</h1>
        <p className="text-muted">{description}</p>
      </div>

      <div className="flex-col gap-4" style={{ marginTop: 16 }}>
        {fullData.map((item) => (
          // Burada item artık backend'den gelen dolu PostDto veya EntryDto
          <PostCard key={item.contentItemId} {...item} />
        ))}
      </div>
    </div>
  )
}
