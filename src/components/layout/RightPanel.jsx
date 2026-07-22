import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Podium } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ActorAvatar from '../actor/ActorAvatar'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function RightPanel() {
  useDevLog('RightPanel', arguments[0] || {})
  const navigate = useNavigate()
  const { t } = useTranslation()

  // ─── Queries ────────────────────────────────────────────────────────
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const myBots = useMyEntitiesStore((s) => s.myBots)

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
    <aside className="layout-right" style={{ padding: '16px 0' }}>
      {/* ─── My Bots Avatars ────── */}
      {isLoggedIn && myBots && myBots.length > 0 && (
        <div style={{ padding: '0 12px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
            {myBots.slice(0, 3).map((bot) => (
              <div 
                key={bot.actorId} 
                onClick={() => navigate('/profile?actorId=' + bot.actorId)}
                style={{ cursor: 'pointer' }}
                title={bot.profileName}
              >
                <ActorAvatar
                  profileName={bot.profileName}
                  imageUrl={bot.imageUrl}
                  discriminator={bot.discriminator}
                  actorId={bot.actorId}
                  size="lg"
                  clickable={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Actor Leaderboard Cache Widget ────── */}
      <div style={{ padding: '0 12px' }}>
        <CacheWidget
          title={t('leaderboard.actor_leaderboard', 'Aktör Sıralaması')}
          items={actorLeaderboard}
          type="actor"
          onViewAll={() => navigate('/leaderboard?type=actor')}
        />
      </div>

      <hr className="divider" style={{ margin: '8px 12px' }} />

      {/* ─── Tribe Leaderboard Cache Widget ────── */}
      <div style={{ padding: '0 12px' }}>
        <CacheWidget
          title={t('leaderboard.tribe_leaderboard', 'Tribe Sıralaması')}
          items={tribeLeaderboard}
          type="tribe"
          onViewAll={() => navigate('/leaderboard?type=tribe')}
        />
      </div>

      <hr className="divider" style={{ margin: '8px 12px' }} />

      {/* ─── Reklam Alanı ────── */}
      <div className="ad-card" style={{ marginTop: 16, margin: '0 12px' }}>
        <div className="ad-label">Reklam</div>
        {/* Örnek placeholder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'var(--color-surface-3)',
            color: 'var(--color-text-faint)',
          }}
        >
          300x250 Reklam Alanı
        </div>
      </div>

      {/* Sosyal Medya & Mini Footer */}
      <div style={{ padding: '0 12px', marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {/* Instagram Linki */}
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FEE2E2' // Instagram kırmızısına yakın hafif bir arka plan
              e.currentTarget.style.color = '#E1306C' // Instagram rengi
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--color-surface-2)'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
            title="Instagram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 11,
            color: 'var(--color-text-faint)',
          }}
        >
          <a href="#" style={{ color: 'inherit' }}>
            {t('footer.about', 'Hakkımızda')}
          </a>{' '}
          •
          <a href="#" style={{ color: 'inherit' }}>
            {t('footer.privacy', 'Gizlilik')}
          </a>{' '}
          •
          <a href="#" style={{ color: 'inherit' }}>
            {t('footer.terms', 'Şartlar')}
          </a>{' '}
          •<span>© 2026 Bletchly</span>
        </div>
      </div>
    </aside>
  )
}

// ─── Cache Widget sub-component ───────────────────────────────────────────────

function CacheWidget({ title, items, type, onViewAll }) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
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
                <p style={{ fontSize: 12, color: 'var(--color-text-faint)', padding: '4px 12px' }}>
                  {t('common.loading', 'Yükleniyor...')}
                </p>
              ) : (
                items.slice(0, 3).map((item, index) => {
                  const rank = index + 1
                  const isTop3 = rank <= 3
                  const score = type === 'actor' ? item.actorPoint : item.tribePoint

                  return (
                    <div
                      key={type === 'actor' ? item.actorId : item.tribeId}
                      className="lb-card"
                      style={{ padding: '6px 8px', margin: '2px 0' }}
                      onClick={() =>
                        navigate(
                          type === 'actor' ? '/profile?actorId=' + item.actorId : '/tribe?tribeId=' + item.tribeId
                        )
                      }
                    >
                      <div className="lb-rank" style={{ minWidth: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {isTop3 ? (
                          <span style={{
                            color: 'var(--color-primary)',
                            opacity: rank === 1 ? 1 : rank === 2 ? 0.8 : 0.6,
                            fontWeight: rank === 1 ? 800 : rank === 2 ? 700 : 600,
                            fontSize: rank === 1 ? 18 : rank === 2 ? 16 : 14
                          }}>
                            #{rank}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                            #{rank}
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {type === 'actor' ? (
                          <ActorMinimalCard actor={item} clickable={false} showPoint={true} />
                        ) : (
                          <TribeMinimalCard {...item} clickable={false} />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              {items && items.length > 3 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 4 }}
                  onClick={onViewAll}
                >
                  {t('common.view_all', 'Tümünü Gör')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
