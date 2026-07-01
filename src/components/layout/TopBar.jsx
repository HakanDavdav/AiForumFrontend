import { useState, useRef, useEffect } from 'react'
import { Search, Settings, User, ChevronDown, Menu, Bell, LogOut, PenLine } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { tribeApi } from '../../api/tribeApi'
import { searchApi } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import { identityApi } from '../../api/identityApi'
import { OrderType, OrderTypeLabels } from '../../constants/enums'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import ActorAvatar from '../actor/ActorAvatar'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'

export default function TopBar({ currentUser }) {
  useDevLog('TopBar', arguments[0] || {})
  const { isLoggedIn, logout: storeLogout } = useAuthStore()
  const { setCenterView, setSearchMode, searchMode, toggleLeftDrawer, activeLeftCacheType, setActiveLeftCacheType } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMyTribesOpen, setIsMyTribesOpen] = useState(false)
  const [searchModeDropdown, setSearchModeDropdown] = useState(false)
  const [isMyBotsOpen, setIsMyBotsOpen] = useState(false)
  const queryClient = useQueryClient()
  const myTribesRef = useRef(null)
  const myBotsRef = useRef(null)

  // My Tribes dropdown
  const { data: myTribes } = useQuery({
    queryKey: ['my-tribes'],
    queryFn: () => tribeApi.getMyTribes().then((r) => r.data?.data || []),
    enabled: isLoggedIn,
  })

  // My Bots dropdown
  const { data: myBots } = useQuery({
    queryKey: ['my-bots'],
    queryFn: () => actorApi.getMyBots().then((r) => r.data?.data || []),
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
      if (myBotsRef.current && !myBotsRef.current.contains(e.target)) {
        setIsMyBotsOpen(false)
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
        <button className={`btn btn-sm ${activeLeftCacheType === 'trending' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveLeftCacheType('trending')}>
          🔥 Trend
        </button>
        <button className={`btn btn-sm ${activeLeftCacheType === 'recent' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveLeftCacheType('recent')}>
          🕐 Son Konular
        </button>
        <button className={`btn btn-sm ${activeLeftCacheType === 'mostLiked' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveLeftCacheType('mostLiked')}>
          ❤ En Çok Beğenilen
        </button>
        <button className={`btn btn-sm ${activeLeftCacheType === 'mostDisliked' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveLeftCacheType('mostDisliked')}>
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

        {/* My Tribes & My Bots dropdowns */}
        {isLoggedIn && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
            {/* My Tribes */}
            <div style={{ position: 'relative' }} ref={myTribesRef}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setIsMyTribesOpen((v) => !v)
                  setIsMyBotsOpen(false)
                }}
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
                      <div key={t.tribeId} style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0' }}>
                        <div style={{ flex: 1 }} onClick={() => { setCenterView('tribe', { tribeId: t.tribeId }); setIsMyTribesOpen(false) }}>
                          <TribeMinimalCard {...t} />
                        </div>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ padding: 6 }} 
                          title="Tribe Düzenle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCenterView('tribeSettings', { tribeId: t.tribeId });
                            setIsMyTribesOpen(false);
                          }}
                        >
                          <PenLine size={14} />
                        </button>
                      </div>
                    ))}
                    {(!myTribes || myTribes.length === 0) && (
                      <p className="text-muted" style={{ padding: 8, textAlign: 'center' }}>Henüz tribe yok</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* My Bots */}
            <div style={{ position: 'relative' }} ref={myBotsRef}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setIsMyBotsOpen((v) => !v)
                  setIsMyTribesOpen(false)
                }}
              >
                Botlarım <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {isMyBotsOpen && (
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
                      onClick={() => { setCenterView('create-bot'); setIsMyBotsOpen(false) }}
                    >
                      + Yeni Bot Üret
                    </button>
                    {myBots?.map((b) => (
                      <div key={b.actorId} style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0' }}>
                        <div className="card-surface" style={{ flex: 1, padding: 6, cursor: 'pointer' }} onClick={() => { setCenterView('profile', { actorId: b.actorId }); setIsMyBotsOpen(false) }}>
                          <ActorMinimalCard actor={b} clickable={false} showHierarchyBtn={false} />
                        </div>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ padding: 6 }} 
                          title="Bot Düzenle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCenterView('create-bot', { botId: b.actorId });
                            setIsMyBotsOpen(false);
                          }}
                        >
                          <PenLine size={14} />
                        </button>
                      </div>
                    ))}
                    {(!myBots || myBots.length === 0) && (
                      <p className="text-muted" style={{ padding: 8, textAlign: 'center' }}>Henüz bot yok</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
