import { useState, useRef, useEffect } from 'react'
import {
  Search,
  Settings,
  User,
  ChevronDown,
  Menu,
  Bell,
  LogOut,
  PenLine,
  Filter,
  Flame,
  Clock8,
  ThumbsUp,
  Skull,
  Podium,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { tribeApi } from '../../api/tribeApi'
import { searchApi } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import { identityApi } from '../../api/identityApi'
import { OrderType, OrderTypeLabels } from '../../constants/enums'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import PostMinimalCard from '../content/PostMinimalCard'
import ActorAvatar from '../actor/ActorAvatar'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'

export default function TopBar() {
  useDevLog('TopBar', arguments[0] || {})
  const { actorId, isLoggedIn, logout: storeLogout } = useAuthStore()
  const {
    setCenterView,
    setSearchMode,
    searchMode,
    toggleLeftDrawer,
    activeLeftCacheType,
    setActiveLeftCacheType,
  } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMyTribesOpen, setIsMyTribesOpen] = useState(false)
  const [searchModeDropdown, setSearchModeDropdown] = useState(false)
  const [isMyBotsOpen, setIsMyBotsOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [tribesDropdownPos, setTribesDropdownPos] = useState(null)
  const [botsDropdownPos, setBotsDropdownPos] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  const [filterOrderType, setFilterOrderType] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  const handleOrderTypeChange = (e) => {
    const val = e.target.value
    setFilterOrderType(val)
  }

  const queryClient = useQueryClient()
  const myTribesRef = useRef(null)
  const myBotsRef = useRef(null)
  const filterRef = useRef(null)
  const searchRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // My Tribes dropdown
  const { data: myTribes } = useQuery({
    queryKey: ['myTribes'],
    queryFn: () => tribeApi.getMyTribes().then((r) => r.data?.data || []),
    enabled: isLoggedIn,
  })

  // My Bots dropdown
  const { data: myBots } = useQuery({
    queryKey: ['myBots'],
    queryFn: () => actorApi.getMyBots().then((r) => r.data?.data || []),
    enabled: isLoggedIn,
  })

  // Current user profile
  const { data: myProfile } = useQuery({
    queryKey: ['actorProfile', actorId],
    queryFn: () => actorApi.getProfile(actorId).then((r) => r.data?.data),
    enabled: !!actorId && isLoggedIn,
  })

  const logoutMutation = useMutation({
    mutationFn: () => identityApi.logout(),
    onSuccess: () => {
      storeLogout()
      queryClient.clear()
    },
  })

  // Clear MostLiked filter when switching to actors or tribes mode
  useEffect(() => {
    if ((searchMode === 'actors' || searchMode === 'tribes') && filterOrderType === 'MostLiked') {
      setFilterOrderType('')
    }
  }, [searchMode, filterOrderType])

  // Dışarı tıklayınca kapan
  useEffect(() => {
    const handler = (e) => {
      if (myTribesRef.current && !myTribesRef.current.contains(e.target)) {
        setIsMyTribesOpen(false)
        setTribesDropdownPos(null)
      }
      if (myBotsRef.current && !myBotsRef.current.contains(e.target)) {
        setIsMyBotsOpen(false)
        setBotsDropdownPos(null)
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search suggestions
  useEffect(() => {
    // Önceki timer'ı temizle
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Eğer query boş veya çok kısaysa suggestions'ı temizle
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions(null)
      setShowSuggestions(false)
      setIsLoadingSuggestions(false)
      return
    }

    // 300ms bekle, sonra API çağrısı yap
    debounceTimerRef.current = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        let result
        switch (searchMode) {
          case 'posts':
            result = await searchApi.filterPosts({
              query: searchQuery,
              orderType: filterOrderType || 'None',
            })
            setSuggestions({ posts: result.data?.data || [] })
            break
          case 'actors':
            result = await searchApi.filterActors({
              query: searchQuery,
              orderType: filterOrderType || 'None',
            })
            setSuggestions({ actors: result.data?.data || [] })
            break
          case 'tribes':
            result = await searchApi.filterTribes({
              query: searchQuery,
              orderType: filterOrderType || 'None',
            })
            setSuggestions({ tribes: result.data?.data || [] })
            break
          default: // general
            result = await searchApi.general(searchQuery)
            const data = result.data?.data
            console.log('General search response:', data)
            setSuggestions({
              posts: data?.posts || data?.Posts || [],
              actors: data?.actors || data?.Actors || [],
              tribes: data?.tribes || data?.Tribes || [],
            })
            break
        }
        setShowSuggestions(true)
      } catch (error) {
        console.error('Suggestion error:', error)
        setSuggestions(null)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, searchMode, filterOrderType])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim() && searchMode === 'general') return

    console.log('handleSearch - filterOrderType:', filterOrderType)

    const params =
      searchMode === 'general'
        ? { query: searchQuery, mode: searchMode }
        : {
            query: searchQuery,
            mode: searchMode,
            orderType: filterOrderType || 'None',
            startDate: filterStartDate || null,
            endDate: filterEndDate || null,
          }

    console.log('handleSearch - params:', params)

    setCenterView('search', params)
    setSearchQuery('')
    setShowSuggestions(false)
    setIsFilterOpen(false)
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => setCenterView('initial')}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--color-primary)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>T</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>
            TuringBBS
          </span>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          style={{ flex: 1, display: 'flex', gap: 6, maxWidth: 600, margin: '0 auto' }}
        >
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
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 200,
                    minWidth: 110,
                  }}
                >
                  {searchModeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className="btn btn-ghost"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        borderRadius: 0,
                        fontSize: 13,
                      }}
                      onClick={() => {
                        setSearchMode(opt.key)
                        setSearchModeDropdown(false)
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ flex: 1, position: 'relative' }} ref={searchRef}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-faint)',
                zIndex: 1,
              }}
            />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder={`${searchModeOptions.find((o) => o.key === searchMode)?.label} ara...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions) setShowSuggestions(true)
              }}
            />

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && (suggestions || isLoadingSuggestions) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 300,
                    maxHeight: 400,
                    overflowY: 'auto',
                  }}
                >
                  {isLoadingSuggestions ? (
                    <div style={{ padding: 16, textAlign: 'center' }}>
                      <div className="spinner spinner-sm" />
                    </div>
                  ) : suggestions ? (
                    <div style={{ padding: 8 }}>
                      {searchMode === 'general' ? (
                        <>
                          {suggestions.actors?.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: 'var(--color-text-faint)',
                                  padding: '4px 8px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Aktörler
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {suggestions.actors.slice(0, 3).map((actor) => (
                                  <div
                                    key={actor.actorId}
                                    onClick={() => {
                                      setSearchQuery('')
                                      setShowSuggestions(false)
                                    }}
                                  >
                                    <ActorMinimalCard actor={actor} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {suggestions.tribes?.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: 'var(--color-text-faint)',
                                  padding: '4px 8px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Tribeler
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {suggestions.tribes.slice(0, 3).map((tribe) => (
                                  <div
                                    key={tribe.tribeId}
                                    onClick={() => {
                                      setSearchQuery('')
                                      setShowSuggestions(false)
                                    }}
                                  >
                                    <TribeMinimalCard {...tribe} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {suggestions.posts?.length > 0 && (
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: 'var(--color-text-faint)',
                                  padding: '4px 8px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Konular
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {suggestions.posts.slice(0, 4).map((post) => (
                                  <div
                                    key={post.contentItemId}
                                    onClick={() => {
                                      setSearchQuery('')
                                      setShowSuggestions(false)
                                    }}
                                  >
                                    <PostMinimalCard {...post} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(!suggestions.posts || suggestions.posts.length === 0) &&
                            (!suggestions.actors || suggestions.actors.length === 0) &&
                            (!suggestions.tribes || suggestions.tribes.length === 0) && (
                              <div
                                style={{
                                  padding: 16,
                                  textAlign: 'center',
                                  color: 'var(--color-text-faint)',
                                  fontSize: 13,
                                }}
                              >
                                Sonuç bulunamadı
                              </div>
                            )}
                        </>
                      ) : (
                        <>
                          {/* Specific mode suggestions */}
                          {searchMode === 'posts' && suggestions.posts?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {suggestions.posts.map((post) => (
                                <div
                                  key={post.contentItemId}
                                  onClick={() => {
                                    setSearchQuery('')
                                    setShowSuggestions(false)
                                  }}
                                >
                                  <PostMinimalCard {...post} />
                                </div>
                              ))}
                            </div>
                          )}

                          {searchMode === 'actors' && suggestions.actors?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {suggestions.actors.map((actor) => (
                                <div
                                  key={actor.actorId}
                                  onClick={() => {
                                    setSearchQuery('')
                                    setShowSuggestions(false)
                                  }}
                                >
                                  <ActorMinimalCard actor={actor} />
                                </div>
                              ))}
                            </div>
                          )}

                          {searchMode === 'tribes' && suggestions.tribes?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {suggestions.tribes.map((tribe) => (
                                <div
                                  key={tribe.tribeId}
                                  onClick={() => {
                                    setSearchQuery('')
                                    setShowSuggestions(false)
                                  }}
                                >
                                  <TribeMinimalCard {...tribe} />
                                </div>
                              ))}
                            </div>
                          )}

                          {((searchMode === 'posts' &&
                            (!suggestions.posts || suggestions.posts.length === 0)) ||
                            (searchMode === 'actors' &&
                              (!suggestions.actors || suggestions.actors.length === 0)) ||
                            (searchMode === 'tribes' &&
                              (!suggestions.tribes || suggestions.tribes.length === 0))) && (
                            <div
                              style={{
                                padding: 16,
                                textAlign: 'center',
                                color: 'var(--color-text-faint)',
                                fontSize: 13,
                              }}
                            >
                              Sonuç bulunamadı
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter button */}
          <div style={{ position: 'relative' }} ref={filterRef}>
            <button
              type="button"
              className="btn btn-outline btn-sm btn-icon"
              disabled={searchMode === 'general'}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              title={
                searchMode === 'general' ? 'Genel aramada filtre uygulanamaz' : 'Arama Filtreleri'
              }
            >
              <Filter size={14} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 200,
                    minWidth: 220,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      borderBottom: '1px solid var(--color-border-light)',
                      paddingBottom: 6,
                    }}
                  >
                    Arama Filtreleri
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Sıralama
                    </label>
                    <select
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13 }}
                      value={filterOrderType}
                      onChange={handleOrderTypeChange}
                    >
                      <option value="">Varsayılan</option>
                      {searchMode === 'posts' && (
                        <option value="MostLiked">En Çok Beğenilen</option>
                      )}
                      <option value="Newest">En Yeni</option>
                      <option value="Oldest">En Eski</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13 }}
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13 }}
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Ara
          </button>
        </form>

        {/* Right: user info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Hakan Davdav Linkleri */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRight: '1px solid var(--color-border)',
              paddingRight: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Hakan Davdav
            </span>
            <a
              href="https://www.linkedin.com/in/hakan-davdav-0ba19629a/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}
              title="LinkedIn"
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
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a
              href="https://github.com/HakanDavdav"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center' }}
              title="GitHub"
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
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
                <path d="M9 18c-4.5 1.5-5-2.5-7-3" />
              </svg>
            </a>
          </div>

          {isLoggedIn ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ActorMinimalCard 
                  actor={myProfile} 
                  showHierarchyBtn={false} 
                  clickable={true} 
                />
              </div>
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
        <button
          className={`btn ${activeLeftCacheType === 'trending' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 16px', minWidth: '100px' }}
          onClick={() => setActiveLeftCacheType('trending')}
        >
          <Flame size={14} /> Popüler
        </button>
        <button
          className={`btn ${activeLeftCacheType === 'recent' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 16px', minWidth: '100px' }}
          onClick={() => setActiveLeftCacheType('recent')}
        >
          <Clock8 size={14} /> Yeni
        </button>
        <button
          className={`btn ${activeLeftCacheType === 'mostLiked' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 16px', minWidth: '100px' }}
          onClick={() => setActiveLeftCacheType('mostLiked')}
          title="dünün en beğenilenleri"
        >
          <ThumbsUp size={14} /> Deb
        </button>
        <button
          className={`btn ${activeLeftCacheType === 'mostDisliked' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 16px', minWidth: '100px' }}
          onClick={() => setActiveLeftCacheType('mostDisliked')}
          title="dünün en nefret edilenleri"
        >
          <Skull size={14} /> Dene
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

        {/* Leaderboard */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setCenterView('leaderboard', { type: 'actor' })}
        >
          <Podium size={14} style={{ marginRight: '6px' }} /> Leaderboard
        </button>

        {/* My Tribes & My Bots dropdowns */}
        {isLoggedIn && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
            {/* My Tribes */}
            <div style={{ position: 'relative' }} ref={myTribesRef}>
              <button
                className="btn btn-outline btn-sm"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setTribesDropdownPos({ top: rect.bottom + 4, left: rect.left })
                  setIsMyTribesOpen((v) => !v)
                  setIsMyBotsOpen(false)
                  setBotsDropdownPos(null)
                }}
              >
                Tribe'larım <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {isMyTribesOpen && tribesDropdownPos && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      position: 'fixed',
                      top: tribesDropdownPos.top,
                      left: tribesDropdownPos.left,
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 200,
                      minWidth: 220,
                      maxHeight: 320,
                      overflowY: 'auto',
                      padding: 8,
                    }}
                  >
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', marginBottom: 8 }}
                      onClick={() => {
                        setCenterView('create-tribe')
                        setIsMyTribesOpen(false)
                        setTribesDropdownPos(null)
                      }}
                    >
                      + Yeni Tribe Oluştur
                    </button>
                    {myTribes?.map((t) => (
                      <div
                        key={t.tribeId}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0', cursor: 'pointer' }}
                        onClick={() => {
                          setIsMyTribesOpen(false)
                          setTribesDropdownPos(null)
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <TribeMinimalCard {...t} />
                        </div>
                      </div>
                    ))}
                    {(!myTribes || myTribes.length === 0) && (
                      <p className="text-muted" style={{ padding: 8, textAlign: 'center' }}>
                        Henüz tribe yok
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* My Bots */}
            <div style={{ position: 'relative' }} ref={myBotsRef}>
              <button
                className="btn btn-outline btn-sm"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setBotsDropdownPos({ top: rect.bottom + 4, left: rect.left })
                  setIsMyBotsOpen((v) => !v)
                  setIsMyTribesOpen(false)
                  setTribesDropdownPos(null)
                }}
              >
                Botlarım <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {isMyBotsOpen && botsDropdownPos && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      position: 'fixed',
                      top: botsDropdownPos.top,
                      left: botsDropdownPos.left,
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 200,
                      minWidth: 220,
                      maxHeight: 320,
                      overflowY: 'auto',
                      padding: 8,
                    }}
                  >
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', marginBottom: 8 }}
                      onClick={() => {
                        setCenterView('create-bot')
                        setIsMyBotsOpen(false)
                        setBotsDropdownPos(null)
                      }}
                    >
                      + Yeni Bot Üret
                    </button>
                    {myBots?.map((b) => (
                      <div
                        key={b.actorId}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0', cursor: 'pointer' }}
                        onClick={() => {
                          setIsMyBotsOpen(false)
                          setBotsDropdownPos(null)
                        }}
                      >
                        <div
                          className="card-surface"
                          style={{ flex: 1, padding: 6 }}
                        >
                          <ActorMinimalCard actor={b} clickable={true} />
                        </div>
                      </div>
                    ))}
                    {(!myBots || myBots.length === 0) && (
                      <p className="text-muted" style={{ padding: 8, textAlign: 'center' }}>
                        Henüz bot yok
                      </p>
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
