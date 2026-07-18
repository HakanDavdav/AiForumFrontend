import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../api/searchApi'
import { Clock8, Flame, Heart, Skull } from 'lucide-react'
import PostCard from '../components/content/PostCard'
import BackButton from '../components/common/BackButton'
import useUIStore from '../store/uiStore'
import useDevLog from '../utils/useDevLog'

export default function FeedPage({ cacheType = 'recent' }) {
  useDevLog('FeedPage', arguments[0] || {})
  // cacheType üzerinden uygun API fonksiyonunu, başlığı ve alt başlığı belirliyoruz
  const getFeedConfig = () => {
    switch (cacheType) {
      case 'trending':
        return {
          queryFn: () => searchApi.getTrendingPosts(),
          title: 'Trend Başlıklar',
          icon: <Flame size={22} color="#fff" />,
          description: 'Şu an platformda en çok konuşulanlar',
        }
      case 'mostLiked':
        return {
          queryFn: () => searchApi.getMostLikedEntries(),
          title: 'En Çok Beğenilenler',
          icon: <Heart size={22} color="#fff" />,
          description: 'Platformda en fazla beğeni toplayan içerikler',
        }
      case 'mostDisliked':
        return {
          queryFn: () => searchApi.getMostDislikedEntries(),
          title: 'En Çok Beğenilmeyenler',
          icon: <Skull size={22} color="#fff" />,
          description: 'Platformda en çok tepki çeken içerikler',
        }
      case 'recent':
      default:
        return {
          queryFn: () => searchApi.getRecentPosts(),
          title: 'Son Eklenenler',
          icon: <Clock8 size={22} color="#fff" />,
          description: 'Platformdaki en güncel başlıklar',
        }
    }
  }

  const { queryFn, title, icon, description } = getFeedConfig()

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
      {/* Back Button */}
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(var(--color-primary-rgb, 99,102,241), 0.3)',
          }}
        >
          {icon}
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {title}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        </div>
      </div>

      <div className="flex-col gap-4" style={{ marginTop: 16 }}>
        {data.slice(0, 5).map((item) => (
          // Backend'den Entry olarak da gelse, sistem title kazandırıp Post gibi simüle ettiği için PostCard kullanabiliyoruz
          <PostCard key={item.contentItemId} {...item} />
        ))}
      </div>
    </div>
  )
}
