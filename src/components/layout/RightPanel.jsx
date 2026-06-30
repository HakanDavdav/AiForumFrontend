import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import LeaderboardCard from '../leaderboard/LeaderboardCard'
import useUIStore from '../../store/uiStore'

export default function RightPanel() {
  const setCenterView = useUIStore((s) => s.setCenterView)

  // ─── Cache Widgets ────────────────────────────────────────────────────────
  const { data: actorLeaderboard } = useQuery({
    queryKey: ['cache', 'actor-leaderboard'],
    queryFn: () => searchApi.getActorLeaderboard().then(parseCacheResponse),
    staleTime: 60_000,
  })

  const { data: tribeLeaderboard } = useQuery({
    queryKey: ['cache', 'tribe-leaderboard'],
    queryFn: () => searchApi.getTribeLeaderboard().then(parseCacheResponse),
    staleTime: 60_000,
  })

  return (
    <aside className="layout-right" style={{ padding: '16px 12px' }}>
      
      {/* ─── Actor Leaderboard Cache Widget ────── */}
      <CacheWidget 
        title="👑 Aktör Sıralaması" 
        items={actorLeaderboard} 
        type="actor" 
        onViewAll={() => setCenterView('leaderboard', { type: 'actor' })}
      />

      <hr className="divider" style={{ margin: '8px 0' }} />

      {/* ─── Tribe Leaderboard Cache Widget ────── */}
      <CacheWidget 
        title="🏆 Tribe Sıralaması" 
        items={tribeLeaderboard} 
        type="tribe"
        onViewAll={() => setCenterView('leaderboard', { type: 'tribe' })}
      />

      <hr className="divider" style={{ margin: '8px 0' }} />

      {/* ─── Reklam Alanı ────── */}
      <div className="ad-card" style={{ marginTop: 16 }}>
        <div className="ad-label">Reklam</div>
        {/* Örnek placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--color-surface-3)', color: 'var(--color-text-faint)' }}>
          300x250 Reklam Alanı
        </div>
      </div>

      {/* Mini Footer / Linkler */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, fontSize: 11, color: 'var(--color-text-faint)' }}>
        <a href="#" style={{ color: 'inherit' }}>Hakkımızda</a> • 
        <a href="#" style={{ color: 'inherit' }}>Gizlilik</a> • 
        <a href="#" style={{ color: 'inherit' }}>Şartlar</a> • 
        <span>© 2026 AiForum</span>
      </div>

    </aside>
  )
}

// ─── Cache Widget sub-component ───────────────────────────────────────────────

function CacheWidget({ title, items, type, onViewAll }) {
  const [expanded, setExpanded] = useState(true)
  const setCenterView = useUIStore((s) => s.setCenterView)

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}
      >
        {title}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.25 }}
             style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!items || items.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--color-text-faint)', padding: '4px 12px' }}>Yükleniyor...</p>
              ) : (
                items.slice(0, 5).map((item, index) => (
                  <LeaderboardCard 
                    key={type === 'actor' ? item.actorId : item.tribeId}
                    rank={index + 1}
                    entity={item}
                    score={type === 'actor' ? item.actorPoint : item.tribePoint}
                    variant={type}
                    onClick={() => setCenterView(type === 'actor' ? 'profile' : 'tribe', type === 'actor' ? { actorId: item.actorId } : { tribeId: item.tribeId })}
                  />
                ))
              )}
              {items && items.length > 5 && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  style={{ marginTop: 4 }}
                  onClick={onViewAll}
                >
                  Tümünü Gör
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
