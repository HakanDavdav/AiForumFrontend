import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, PenSquare, Flame, Clock8, ThumbsUp, Skull, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import PostMinimalCard from '../content/PostMinimalCard'
import EntryMinimalCard from '../content/EntryMinimalCard'
import ActivityItem from '../activity/ActivityItem'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function LeftPanel() {
  useDevLog('LeftPanel', arguments[0] || {})
  const { isLoggedIn, actorId } = useAuthStore()
  const navigate = useNavigate()
  const { isActivitiesExpanded, toggleActivities, activeLeftCacheType } =
    useUIStore()
  const queryClient = useQueryClient()
  const [isCacheExpanded, setIsCacheExpanded] = useState(true)
  const { t } = useTranslation()
  const lastCountRef = useRef(-1)

  // ─── Cache Widgets ────────────────────────────────────────────────────────
  const { data: recentPosts } = useQuery({
    queryKey: ['cache', 'recent-posts'],
    queryFn: () => searchApi.getRecentPosts().then(parseCacheResponse),
    staleTime: 60_000,
  })

  const { data: trendingPosts } = useQuery({
    queryKey: ['cache', 'trending-posts'],
    queryFn: () => searchApi.getTrendingPosts().then(parseCacheResponse),
    staleTime: 60_000,
  })

  const { data: mostLikedEntries } = useQuery({
    queryKey: ['cache', 'most-liked'],
    queryFn: () => searchApi.getMostLikedEntries().then(parseCacheResponse),
    staleTime: 60_000,
  })

  const { data: mostDislikedEntries } = useQuery({
    queryKey: ['cache', 'most-disliked'],
    queryFn: () => searchApi.getMostDislikedEntries().then(parseCacheResponse),
    staleTime: 60_000,
  })

  // ─── Activities ───────────────────────────────────────────────────────────
  const {
    data: activitiesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchActivities,
  } = useInfiniteQuery({
    queryKey: ['activities', actorId],
    queryFn: ({ pageParam = 1 }) => actorApi.getActivities(actorId, pageParam).then((r) => r.data?.data || []),
    getNextPageParam: (lastPage, allPages) => {
      // API sayfa boyutu 10 ise, tam 10 veri gelmişse sonraki sayfa olabilir.
      // Eğer backend pagination desteklemiyorsa ve hepsini birden döndürüyorsa (örn 148 tane)
      // bu sayede sonsuz döngüye girip tekrar tekrar yüklemeyi durdurur.
      return lastPage?.length === 10 ? allPages.length + 1 : undefined
    },
    enabled: isLoggedIn && !!actorId,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  })

  const activities = React.useMemo(() => activitiesData?.pages?.flatMap((p) => p) || [], [activitiesData])

  const { data: unreadCount } = useQuery({
    queryKey: ['activities-unread'],
    queryFn: () => actorApi.getUnreadActivityCount().then((r) => r.data?.data ?? 0),
    enabled: isLoggedIn,
    refetchInterval: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: (ids) => actorApi.markActivitiesRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities'])
      queryClient.invalidateQueries(['activities-unread'])
    },
  })

  // Panel açıldığında veya yeni veri yüklendiğinde, ekrandaki tüm okumadığımız aktiviteleri otomatik okundu işaretle
  useEffect(() => {
    if (isActivitiesExpanded && activities?.length > 0) {
      const unreadIds = activities
        .filter((a) => !a.isRead)
        .map((a) => a.activityId)

      if (unreadIds.length > 0) {
        markReadMutation.mutate(unreadIds)
      }
    }
  }, [isActivitiesExpanded, activities])

  const handleToggleActivities = () => {
    if (!isActivitiesExpanded) {
      if (lastCountRef.current !== unreadCount) {
        queryClient.invalidateQueries({ queryKey: ['activities'] })
        lastCountRef.current = unreadCount
      }
    } else {
      // Menü kapanırken güncel sayıyı (genelde 0 olur okunduğu için) kaydedelim
      lastCountRef.current = unreadCount
    }
    toggleActivities()
  }

  return (
    <aside className="layout-left" style={{ padding: '12px 0' }}>
      {/* ─── Create Post Button ── */}
      {isLoggedIn && (
        <div style={{ padding: '0 12px 8px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', gap: 8, fontSize: 14, padding: '10px 16px' }}
            onClick={() => navigate('/create-post')}
          >
            {t('left_panel.new_topic')}
          </button>
        </div>
      )}

      {/* ─── Enrich News Pool Button (always visible) ── */}
      <div style={{ padding: isLoggedIn ? '0 12px 12px' : '0 12px 12px' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', gap: 8, fontSize: 14, padding: '10px 16px' }}
          onClick={() => navigate('/enrich-news')}
        >
          {t('left_panel.enrich_news')}
        </button>
      </div>

      {/* ─── Activities ──────── */}
      {isLoggedIn && (
        <div style={{ marginBottom: 4 }}>
          <button
            onClick={handleToggleActivities}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {t('left_panel.activities')}
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            {isActivitiesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence>
            {isActivitiesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <ActivitiesScrollArea
                  onScrollBottom={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                      fetchNextPage()
                    }
                  }}
                >
                  <div style={{ padding: '0 8px' }}>
                    {activities?.length === 0 && (
                      <p className="empty-state" style={{ padding: '12px 8px' }}>
                        {t('left_panel.no_activity')}
                      </p>
                    )}
                    {activities?.map((a) => (
                      <ActivityItem
                        key={a.activityId}
                        activity={a}
                        onMarkRead={(id) => markReadMutation.mutate([id])}
                      />
                    ))}
                    {isFetchingNextPage && (
                      <p style={{ textAlign: 'center', padding: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
                        {t('left_panel.loading')}
                      </p>
                    )}
                  </div>
                </ActivitiesScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <hr className="divider" style={{ margin: '4px 0' }} />

      {/* ─── Cache Widgets ────── */}
      {activeLeftCacheType === 'recent' && (
        <CacheWidget title={t('sort.new', 'Yeni')} items={recentPosts} type="post" expanded={isCacheExpanded} setExpanded={setIsCacheExpanded} />
      )}
      {activeLeftCacheType === 'trending' && (
        <CacheWidget title={t('sort.popular', 'Popüler')} items={trendingPosts} type="post" expanded={isCacheExpanded} setExpanded={setIsCacheExpanded} />
      )}
      {activeLeftCacheType === 'mostLiked' && (
        <CacheWidget title={t('sort.best', 'En İyiler')} items={mostLikedEntries} type="entry" expanded={isCacheExpanded} setExpanded={setIsCacheExpanded} />
      )}
      {activeLeftCacheType === 'mostDisliked' && (
        <CacheWidget title={t('sort.worst', 'En Kötüler')} items={mostDislikedEntries} type="entry" expanded={isCacheExpanded} setExpanded={setIsCacheExpanded} />
      )}

      <hr className="divider" style={{ margin: '4px 0' }} />

      {/* ─── Auth Section ─────── */}
      <div style={{ padding: '8px 12px' }}>
        {isLoggedIn ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              background: 'var(--color-success-light)',
              borderRadius: 8,
              fontSize: 12,
              color: '#15803D',
              fontWeight: 500,
            }}
          >
            <span>✓</span> {t('left_panel.logged_in')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              className="btn btn-outline"
              style={{ width: '100%', fontSize: 13 }}
              onClick={() => navigate('/login')}
            >
              {t('left_panel.login')}
            </button>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 13 }}
              onClick={() => navigate('/register')}
            >
              {t('left_panel.register')}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Cache Widget sub-component ───────────────────────────────────────────────

function CacheWidget({ title, items, type, expanded, setExpanded }) {
  const [limit, setLimit] = useState(25)
  const { t } = useTranslation()

  const maxItems = items ? items.length : 0

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 16px',
        }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: 0,
            flex: 1,
            textAlign: 'left'
          }}
        >
          {title}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {expanded && maxItems > 0 && (
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              color: 'var(--color-text-secondary)',
              fontSize: 11,
              padding: '2px 4px',
              outline: 'none',
              cursor: 'pointer'
            }}
            title="Gösterilecek öğe sayısı"
          >
            <option value={25}>25</option>
            {maxItems > 25 && <option value={50}>50</option>}
            {maxItems > 50 && <option value={75}>75</option>}
            <option value={maxItems}>{t('left_panel.show_all')} ({maxItems})</option>
          </select>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '0 4px' }}>
          {!items || items.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--color-text-faint)', padding: '4px 12px' }}>
              {t('left_panel.loading')}
            </p>
          ) : (
            items
              .slice(0, limit)
              .map((item) =>
                type === 'post' ? (
                  <PostMinimalCard key={item.contentItemId} {...item} />
                ) : (
                  <EntryMinimalCard key={item.contentItemId} {...item} />
                )
              )
          )}
        </div>
      )}
    </div>
  )
}

// ─── ActivitiesScrollArea sub-component ──────────────────────────────────────────

function ActivitiesScrollArea({ children, onScrollBottom }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleWheel = (e) => {
      // Sadece mouse tekerleğiyle kaydırmayı engelle
      e.preventDefault()
      
      // Kaydırma hareketini doğrudan sol panele (parent'a) aktar
      const parent = el.closest('.layout-left')
      if (parent) {
        parent.scrollTop += e.deltaY
      }
    }

    // passive: false kullanarak e.preventDefault() çalışmasını sağlıyoruz
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  const handleScroll = (e) => {
    const el = e.currentTarget
    // Alt sınıra yaklaşıldığında (örneğin 50px kala) onScrollBottom tetikle
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      if (onScrollBottom) onScrollBottom()
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{
        maxHeight: 350,
        overflowY: 'auto',
        direction: 'rtl', // Scrollbar'ı sola al
        paddingRight: 4, // rtl olduğu için sağ padding (görsel olarak sağ taraf)
        paddingLeft: 4,  // Scrollbar ile içerik arası boşluk
      }}
      className="activities-scrollbar"
    >
      <div style={{ direction: 'ltr' }}>
        {children}
      </div>
    </div>
  )
}
