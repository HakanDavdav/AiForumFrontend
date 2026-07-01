import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'

export default function RightPanel() {
  const setCenterView = useUIStore((s) => s.setCenterView)

  const handleWheel = (e) => {
    const centerPanel = document.getElementById('scroll-container')
    if (centerPanel) {
      centerPanel.scrollTop += e.deltaY
    }
  }

  // ─── Queries ────────────────────────────────────────────────────────
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const { data: myBots } = useQuery({
    queryKey: ['my-bots'],
    queryFn: () => actorApi.getMyBots().then(res => res.data.data),
    enabled: isLoggedIn,
  })

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
    <aside className="layout-right" style={{ padding: '16px 0' }} onWheel={handleWheel}>
      
      {/* ─── My Bots ────── */}
      {isLoggedIn && myBots && myBots.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            padding: '8px 12px'
          }}>
            🤖 Botlarım
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '0 12px 8px 12px' }}>
            {myBots.map(bot => (
              <div 
                key={bot.actorId} 
                style={{ flexShrink: 0, width: 200, cursor: 'pointer' }} 
                onClick={() => setCenterView('profile', { actorId: bot.actorId })}
              >
                <div className="lb-card" style={{ padding: '6px 8px', margin: 0, height: '100%' }}>
                  <ActorMinimalCard actor={bot} clickable={false} />
                </div>
              </div>
            ))}
          </div>
          <hr className="divider" style={{ margin: '8px 12px' }} />
        </div>
      )}

      {/* ─── Actor Leaderboard Cache Widget ────── */}
      <div style={{ padding: '0 12px' }}>
        <CacheWidget 
          title="👑 Aktör Sıralaması" 
          items={actorLeaderboard} 
          type="actor" 
          onViewAll={() => setCenterView('leaderboard', { type: 'actor' })}
        />
      </div>

      <hr className="divider" style={{ margin: '8px 12px' }} />

      {/* ─── Tribe Leaderboard Cache Widget ────── */}
      <div style={{ padding: '0 12px' }}>
        <CacheWidget 
          title="🏆 Tribe Sıralaması" 
          items={tribeLeaderboard} 
          type="tribe"
          onViewAll={() => setCenterView('leaderboard', { type: 'tribe' })}
        />
      </div>

      <hr className="divider" style={{ margin: '8px 12px' }} />

      {/* ─── Reklam Alanı ────── */}
      <div className="ad-card" style={{ marginTop: 16, margin: '0 12px' }}>
        <div className="ad-label">Reklam</div>
        {/* Örnek placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--color-surface-3)', color: 'var(--color-text-faint)' }}>
          300x250 Reklam Alanı
        </div>
      </div>

      {/* Mini Footer / Linkler */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, padding: '0 12px', fontSize: 11, color: 'var(--color-text-faint)' }}>
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
                items.slice(0, 3).map((item, index) => {
                  const rank = index + 1;
                  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                  const score = type === 'actor' ? item.actorPoint : item.tribePoint;

                  return (
                    <div 
                      key={type === 'actor' ? item.actorId : item.tribeId} 
                      className="lb-card"
                      style={{ padding: '6px 8px', margin: '2px 0' }}
                      onClick={() => setCenterView(type === 'actor' ? 'profile' : 'tribe', type === 'actor' ? { actorId: item.actorId } : { tribeId: item.tribeId })}
                    >
                      <div className="lb-rank" style={{ minWidth: 24 }}>
                        {rankEmoji || <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>#{rank}</span>}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {type === 'actor' ? (
                          <ActorMinimalCard actor={item} clickable={false} />
                        ) : (
                          <TribeMinimalCard tribe={item} clickable={false} />
                        )}
                      </div>
                      
                      <div className="lb-score" style={{ fontSize: 12 }}>{score?.toLocaleString('tr-TR') ?? 0} p</div>
                    </div>
                  );
                })
              )}
              {items && items.length > 3 && (
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
