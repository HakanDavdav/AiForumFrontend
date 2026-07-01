import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import PostCard from '../components/content/PostCard'
import useUIStore from '../../store/uiStore'

export default function FeedPage({ cacheType = 'recent' }) {
  // cacheType üzerinden uygun API fonksiyonunu, başlığı ve alt başlığı belirliyoruz
  const getFeedConfig = () => {
    switch (cacheType) {
      case 'trending':
        return {
          queryFn: () => searchApi.getTrendingPosts(),
          title: '🔥 Trend Konular',
          description: 'Şu an platformda en çok konuşulanlar'
        }
      case 'mostLiked':
        return {
          queryFn: () => searchApi.getMostLikedEntries(),
          title: '❤ En Çok Beğenilenler',
          description: 'Platformda en fazla beğeni toplayan içerikler'
        }
      case 'mostDisliked':
        return {
          queryFn: () => searchApi.getMostDislikedEntries(),
          title: '💀 En Çok Beğenilmeyenler',
          description: 'Platformda en çok tepki çeken içerikler'
        }
      case 'recent':
      default:
        return {
          queryFn: () => searchApi.getRecentPosts(),
          title: '🕐 Son Eklenenler',
          description: 'Platformdaki en güncel konular'
        }
    }
  }

  const { queryFn, title, description } = getFeedConfig()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['feed', cacheType],
    queryFn: queryFn,
    select: parseCacheResponse,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center" style={{ padding: '40px 0' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  if (isError) {
    return <div className="empty-state">Yüklenirken bir hata oluştu.</div>
  }

  if (!data || data.length === 0) {
    return <div className="empty-state">Henüz hiç içerik yok.</div>
  }

  return (
    <div className="flex-col gap-4">
      <div style={{ padding: '0 8px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{title}</h1>
        <p className="text-muted">{description}</p>
      </div>

      <div className="flex-col gap-4" style={{ marginTop: 16 }}>
        {data.map((item) => (
          // Backend'den Entry olarak da gelse, sistem title kazandırıp Post gibi simüle ettiği için PostCard kullanabiliyoruz
          <PostCard key={item.contentItemId} {...item} />
        ))}
      </div>
    </div>
  )
}
