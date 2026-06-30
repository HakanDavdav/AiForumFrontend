import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import PostCard from '../components/content/PostCard'
import useUIStore from '../../store/uiStore'

export default function FeedPage({ cacheType = 'recent' }) {
  // FeedPage'de ya "Son Konular" ya da "Trend Konular" gösterilir
  // (Beğenilen/Beğenilmeyen Entry'ler genelde yan barlarda kompakt olarak gösterilir, ama buraya da eklenebilir)

  const isTrending = cacheType === 'trending'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['feed', isTrending ? 'trending' : 'recent'],
    queryFn: () => isTrending ? searchApi.getTrendingPosts() : searchApi.getRecentPosts(),
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
    return <div className="empty-state">Henüz hiç gönderi yok.</div>
  }

  return (
    <div className="flex-col gap-4">
      <div style={{ padding: '0 8px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          {isTrending ? '🔥 Trend Konular' : '🕐 Son Eklenenler'}
        </h1>
        <p className="text-muted">
          {isTrending ? 'Şu an platformda en çok konuşulanlar' : 'Platformdaki en güncel konular'}
        </p>
      </div>

      <div className="flex-col gap-4" style={{ marginTop: 16 }}>
        {data.map((post) => (
          <PostCard key={post.contentItemId} {...post} />
        ))}
      </div>
    </div>
  )
}
