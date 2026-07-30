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
            type="button"
            onClick={() => navigate('/create-post')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              padding: '9px 14px',
              color: '#ffffff',
              background: 'linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 50%, var(--color-primary-gradient-end) 100%)',
              borderRadius: 10,
              border: 'none',
              boxShadow: '0 3px 12px 0 var(--color-primary-shadow)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1.5px)'
              e.currentTarget.style.boxShadow = '0 5px 16px 0 var(--color-primary-shadow)'
              e.currentTarget.style.filter = 'brightness(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 3px 12px 0 var(--color-primary-shadow)'
              e.currentTarget.style.filter = 'none'
            }}
          >
            <PenSquare size={16} style={{ color: 'rgba(255, 255, 255, 0.85)', filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.25))' }} />
            <span>{t('left_panel.new_topic')}</span>
          </button>
        </div>
      )}

      {/* ─── Enrich News Pool Button (always visible) ── */}
      <div style={{ padding: '0 12px 12px' }}>
        <button
          type="button"
          onClick={() => navigate('/enrich-news')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            padding: '9px 14px',
            color: '#ffffff',
            background: 'linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 50%, var(--color-primary-gradient-end) 100%)',
            borderRadius: 10,
            border: 'none',
            boxShadow: '0 3px 12px 0 var(--color-primary-shadow)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1.5px)'
            e.currentTarget.style.boxShadow = '0 5px 16px 0 var(--color-primary-shadow)'
            e.currentTarget.style.filter = 'brightness(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 3px 12px 0 var(--color-primary-shadow)'
            e.currentTarget.style.filter = 'none'
          }}
        >
          <Sparkles size={16} style={{ color: 'rgba(255, 255, 255, 0.85)', filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.25))' }} />
          <span>{t('left_panel.enrich_news')}</span>
        </button>
      </div>

      <hr className="divider" style={{ margin: '4px 0' }} />

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
        <CacheWidget title={t('sort.new', 'Yeni')} items={recentPosts} type="post" />
      )}
      {activeLeftCacheType === 'trending' && (
        <CacheWidget title={t('sort.popular', 'Popüler')} items={trendingPosts} type="post" />
      )}
      {activeLeftCacheType === 'mostLiked' && (
        <CacheWidget title={t('sort.best', 'En İyiler')} items={mostLikedEntries} type="entry" />
      )}
      {activeLeftCacheType === 'mostDisliked' && (
        <CacheWidget title={t('sort.worst', 'En Kötüler')} items={mostDislikedEntries} type="entry" />
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

function CacheWidget({ title, items, type }) {
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
          padding: '8px 16px 8px',
          borderRadius: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            lineHeight: 1,
          }}
        >
          {title}
        </span>

        {maxItems > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '2px 6px',
              minWidth: 40,
              justifyContent: 'center',
            }}
          >
            <LimitDropdown
              limit={limit}
              onChange={setLimit}
              maxItems={maxItems}
              t={t}
            />
          </div>
        )}
      </div>

      <div style={{ padding: '2px 4px 0' }}>
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
    </div>
  )
}

// ─── ActivitiesScrollArea sub-component ──────────────────────────────────────────

// ─── Limit Dropdown sub-component ──────────────────────────────────────────────

function LimitDropdown({ limit, onChange, maxItems, t }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const options = [
    { value: 25, label: '25' },
    ...(maxItems > 25 ? [{ value: 50, label: '50' }] : []),
    ...(maxItems > 50 ? [{ value: 75, label: '75' }] : []),
    { value: maxItems, label: `${t('left_panel.show_all')} (${maxItems})` },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          color: 'var(--color-text-secondary)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '2px 0',
          fontFamily: 'inherit',
          lineHeight: 1,
          outline: 'none',
        }}
      >
        {limit}
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: 4,
            zIndex: 100,
            minWidth: 80,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                display: 'block',
                width: '100%',
                background: opt.value === limit ? 'var(--color-primary-light)' : 'none',
                border: 'none',
                color: opt.value === limit ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                fontSize: 11,
                fontWeight: opt.value === limit ? 700 : 500,
                padding: '5px 10px',
                borderRadius: 5,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                lineHeight: 1,
                outline: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== limit) e.currentTarget.style.background = 'var(--color-surface)'
              }}
              onMouseLeave={(e) => {
                if (opt.value !== limit) e.currentTarget.style.background = 'none'
              }}
            >
              {opt.label}
            </button>
          ))}
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
