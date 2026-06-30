import { useState, useRef, useEffect } from 'react'
import { Search, Settings, User, ChevronDown, Menu, Bell, LogOut } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { tribeApi } from '../../api/tribeApi'
import { identityApi } from '../../api/identityApi'
import { searchApi } from '../../api/searchApi'
import { OrderType, OrderTypeLabels } from '../../constants/enums'
import TribeCard from '../tribe/TribeCard'
import ActorAvatar from '../actor/ActorAvatar'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

export default function TopBar({ currentUser }) {
  const { isLoggedIn, logout: storeLogout } = useAuthStore()
  const { setCenterView, setSearchMode, searchMode, toggleLeftDrawer } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMyTribesOpen, setIsMyTribesOpen] = useState(false)
  const [searchModeDropdown, setSearchModeDropdown] = useState(false)
  const queryClient = useQueryClient()
  const myTribesRef = useRef(null)

  // My Tribes dropdown
  const { data: myTribes } = useQuery({
    queryKey: ['my-tribes'],
    queryFn: () => tribeApi.getMyTribes().then((r) => r.data?.data || []),
    enabled: isLoggedIn,
  })

  const logoutMutation = useMutation({
    mutationFn: () => identityApi.logout(),
    onSuccess: () => {
      storeLogout()
      queryClient.clear()
    },
  })

  // Dışarı tıklayınca kapan
  useEffect(() => {
    const handler = (e) => {
      if (myTribesRef.current && !myTribesRef.current.contains(e.target)) {
        setIsMyTribesOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setCenterView('search', { query: searchQuery, mode: searchMode })
    setSearchQuery('')
  }

  const searchModeOptions = [
    { key: 'general', label: 'Genel' },
    { key: 'posts', label: 'Konular' },
    { key: 'actors', label: 'Aktörler' },
    { key: 'tribes', label: 'Tribeler' },
  ]

  return (
    <header className="layout-topbar">
      {/* ─── Row 1 ─── */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          borderBottom: '1px solid var(--color-border-light)',
        }}
      >
        {/* Hamburger (mobil) */}
        <button className="btn-icon" onClick={toggleLeftDrawer} style={{ display: 'none' }}>
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setCenterView('feed')}
        >
          <div
            style={{
              width: 32, height: 32,
              background: 'var(--color-primary)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>A</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>
            AiForum
          </span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 6, maxWidth: 600, margin: '0 auto' }}>
          {/* Mode selector */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSearchModeDropdown((v) => !v)}
              style={{ gap: 4, whiteSpace: 'nowrap' }}
            >
              {searchModeOptions.find((o) => o.key === searchMode)?.label}
              <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {searchModeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 4,
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                    borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 200, minWidth: 110,
                  }}
                >
                  {searchModeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, fontSize: 13 }}
                      onClick={() => { setSearchMode(opt.key); setSearchModeDropdown(false) }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text-faint)',
              }}
            />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder={`${searchModeOptions.find((o) => o.key === searchMode)?.label} ara...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Ara</button>
        </form>

        {/* Right: user info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isLoggedIn && currentUser ? (
            <>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                {currentUser.profileName}
              </span>
              <button
                className="btn-icon"
                onClick={() => setCenterView('profile', { actorId: currentUser.actorId })}
                title="Profilim"
              >
                <ActorAvatar
                  profileName={currentUser.profileName}
                  imageUrl={currentUser.imageUrl}
                  discriminator={currentUser.discriminator}
                  actorId={currentUser.actorId}
                  size="sm"
                />
              </button>
              <button
                className="btn-icon"
                onClick={() => setCenterView('account-settings')}
                title="Ayarlar"
              >
                <Settings size={16} />
              </button>
              <button
                className="btn-icon"
                onClick={() => logoutMutation.mutate()}
                title="Çıkış Yap"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setCenterView('login')}>
                Giriş Yap
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setCenterView('register')}>
                Kayıt Ol
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Row 2 ─── */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 8,
          overflowX: 'auto',
        }}
      >
        {/* Cache buttons */}
        <button className="btn btn-ghost btn-sm" onClick={() => setCenterView('feed', { cacheType: 'trending' })}>
          🔥 Trend
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCenterView('feed', { cacheType: 'recent' })}>
          🕐 Son Konular
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCenterView('feed', { cacheType: 'mostLiked' })}>
          ❤ En Çok Beğenilen
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCenterView('feed', { cacheType: 'mostDisliked' })}>
          💀 En Çok Beğenilmeyen
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

        {/* Leaderboard */}
        <button className="btn btn-ghost btn-sm" onClick={() => setCenterView('leaderboard', { type: 'tribe' })}>
          🏆 Tribe Sıralaması
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCenterView('leaderboard', { type: 'actor' })}>
          👑 Aktör Sıralaması
        </button>

        {/* My Tribes dropdown */}
        {isLoggedIn && (
          <div style={{ position: 'relative', marginLeft: 4 }} ref={myTribesRef}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setIsMyTribesOpen((v) => !v)}
            >
              Tribe'larım <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {isMyTribesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 4,
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                    borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 200,
                    minWidth: 220, maxHeight: 320, overflowY: 'auto', padding: 8,
                  }}
                >
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', marginBottom: 8 }}
                    onClick={() => { setCenterView('create-tribe'); setIsMyTribesOpen(false) }}
                  >
                    + Yeni Tribe Oluştur
                  </button>
                  {myTribes?.map((t) => (
                    <div key={t.tribeId} onClick={() => { setCenterView('tribe', { tribeId: t.tribeId }); setIsMyTribesOpen(false) }}>
                      <TribeCard {...t} />
                    </div>
                  ))}
                  {(!myTribes || myTribes.length === 0) && (
                    <p className="text-muted" style={{ padding: 8, textAlign: 'center' }}>Henüz tribe yok</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  )
}
