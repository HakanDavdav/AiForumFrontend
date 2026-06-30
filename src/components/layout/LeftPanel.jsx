import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, PenSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import { PostMinimalCard } from '../content/PostCard'
import { EntryMinimalCard } from '../content/EntryCard'
import ActivityItem from '../activity/ActivityItem'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

export default function LeftPanel() {
  const { isLoggedIn, actorId } = useAuthStore()
  const { setCenterView, isActivitiesExpanded, toggleActivities } = useUIStore()
  const queryClient = useQueryClient()

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
  const { data: activities } = useQuery({
    queryKey: ['activities', 1],
    queryFn: () => actorApi.getActivities(1).then((r) => r.data?.data || []),
    enabled: isLoggedIn,
  })

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

  return (
    <aside className="layout-left" style={{ padding: '12px 0' }}>
      {/* ─── Create Post Button ── */}
      {isLoggedIn && (
        <div style={{ padding: '0 12px 12px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', gap: 8, fontSize: 14, padding: '10px 16px' }}
            onClick={() => setCenterView('create-post')}
          >
            <PenSquare size={16} />
            Yeni Konu Başlat
          </button>
        </div>
      )}

      {/* ─── Activities ──────── */}
      {isLoggedIn && (
        <div style={{ marginBottom: 4 }}>
          <button
            onClick={toggleActivities}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Aktiviteler
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--color-primary)', color: 'white',
                    borderRadius: 99, fontSize: 10, fontWeight: 700,
                    padding: '1px 6px', minWidth: 18, textAlign: 'center',
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
                <div style={{ maxHeight: 280, overflowY: 'auto', padding: '0 8px' }}>
                  {activities?.length === 0 && (
                    <p className="empty-state" style={{ padding: '12px 8px' }}>Aktivite yok</p>
                  )}
                  {activities?.slice(0, 7).map((a) => (
                    <ActivityItem
                      key={a.activityId}
                      activity={a}
                      onMarkRead={(id) => markReadMutation.mutate([id])}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <hr className="divider" style={{ margin: '4px 0' }} />

      {/* ─── Cache Widgets ────── */}
      <CacheWidget title="🕐 Son Konular" items={recentPosts} type="post" />
      <CacheWidget title="🔥 Trend Konular" items={trendingPosts} type="post" />
      <CacheWidget title="❤ En Çok Beğenilen" items={mostLikedEntries} type="entry" />
      <CacheWidget title="💀 En Çok Beğenilmeyen" items={mostDislikedEntries} type="entry" />

      <hr className="divider" style={{ margin: '4px 0' }} />

      {/* ─── Auth Section ─────── */}
      <div style={{ padding: '8px 12px' }}>
        {isLoggedIn ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 8px', background: 'var(--color-success-light)',
              borderRadius: 8, fontSize: 12, color: '#15803D', fontWeight: 500,
            }}
          >
            <span>✓</span> Oturum Açık
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              className="btn btn-outline"
              style={{ width: '100%', fontSize: 13 }}
              onClick={() => setCenterView('login')}
            >
              Giriş Yap
            </button>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 13 }}
              onClick={() => setCenterView('register')}
            >
              Kayıt Ol
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Cache Widget sub-component ───────────────────────────────────────────────

function CacheWidget({ title, items, type }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 16px', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}
      >
        {title}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 4px' }}>
          {!items || items.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--color-text-faint)', padding: '4px 12px' }}>Yükleniyor...</p>
          ) : (
            items.slice(0, 6).map((item) =>
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
