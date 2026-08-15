import { useState, useRef, useEffect } from 'react'
import {
  Search,
  Settings,
  User,
  Menu,
  Bell,
  LogOut,
  PenLine,
  Filter,
  ThumbsUp,
  Podium,
  Sun,
  Moon,
  Bot,
  CirclePlus,
  PaintbrushVertical,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { tribeApi } from '../../api/tribeApi'
import { searchApi } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import { identityApi } from '../../api/identityApi'
import { useNavigate, useLocation } from 'react-router-dom'
import { OrderType, OrderTypeLabels } from '../../constants/enums'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import PostMinimalCard from '../content/PostMinimalCard'
import ActorAvatar from '../actor/ActorAvatar'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useThemeStore from '../../store/themeStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import BotFlashCardsIcon from '../common/BotFlashCardsIcon'
import IconActionButton from '../common/IconActionButton'
import HowItWorksHelp from '../common/HowItWorksHelp'
import Logo from '../common/Logo'

export default function TopBar() {
  useDevLog('TopBar', arguments[0] || {})
  const { actorId, isLoggedIn, isAdmin, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    setSearchMode,
    searchMode,
    toggleLeftDrawer,
    activeLeftCacheType,
    setActiveLeftCacheType,
  } = useUIStore()
  const langs = [
    { code: 'tr', label: 'Türkçe', flagUrl: 'https://flagcdn.com/w20/tr.png' },
    { code: 'en', label: 'English', flagUrl: 'https://flagcdn.com/w20/us.png' },
    { code: 'zh', label: '中文', flagUrl: 'https://flagcdn.com/w20/cn.png' },
    { code: 'ja', label: '日本語', flagUrl: 'https://flagcdn.com/w20/jp.png' },
    { code: 'hi', label: 'हिन्दी', flagUrl: 'https://flagcdn.com/w20/in.png' },
    { code: 'ku', label: 'Kurdî', flagUrl: null, fallbackEmoji: '☀️' },
    { code: 'de', label: 'Deutsch', flagUrl: 'https://flagcdn.com/w20/de.png' },
    { code: 'fr', label: 'Français', flagUrl: 'https://flagcdn.com/w20/fr.png' },
    { code: 'ar', label: 'العربية', flagUrl: 'https://flagcdn.com/w20/sa.png' },
  ]

  const { t, i18n } = useTranslation()
  const rawLang = (i18n.language || 'tr').toLowerCase()
  const activeLangObj =
    langs.find((l) => l.code === rawLang || l.code === rawLang.split('-')[0]) || langs[0]
  const currentLang = activeLangObj.code

  const { isDarkMode, toggleTheme, isGreenMode, toggleGreenMode } = useThemeStore()
  const [isBotShaking, setIsBotShaking] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [langDropdownPos, setLangDropdownPos] = useState(null)
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

  const handleBotClick = () => {
    toggleGreenMode()
    setIsBotShaking(true)
    setTimeout(() => setIsBotShaking(false), 500)
  }

  const queryClient = useQueryClient()
  const myTribesRef = useRef(null)
  const myBotsRef = useRef(null)
  const filterRef = useRef(null)
  const searchRef = useRef(null)
  const langRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // My Tribes & Bots from Global State
  const {
    myTribes,
    myBots,
    fetchMyTribes,
    fetchMyBots,
    fetchMyFollowData,
    hasFetchedOnce,
    clear: clearEntities,
  } = useMyEntitiesStore()

  useEffect(() => {
    if (isLoggedIn && !hasFetchedOnce) {
      fetchMyTribes()
      fetchMyBots()
      fetchMyFollowData()
    }
  }, [isLoggedIn, hasFetchedOnce, fetchMyTribes, fetchMyBots, fetchMyFollowData])

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
      clearEntities()
      queryClient.clear()
      navigate('/')
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
      if (langRef.current && !langRef.current.contains(e.target)) {
        setIsLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sayfa değiştiğinde arama önerilerini kapat
  useEffect(() => {
    setShowSuggestions(false)
  }, [location.pathname, location.search])

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

    // Transform search parameters to URL query params
    const searchParams = new URLSearchParams()
    if (params.query) searchParams.append('query', params.query)
    if (params.mode) searchParams.append('mode', params.mode)
    if (params.orderType) searchParams.append('orderType', params.orderType)
    if (params.startDate) searchParams.append('startDate', params.startDate)
    if (params.endDate) searchParams.append('endDate', params.endDate)
    navigate('/search?' + searchParams.toString())
    setSearchQuery('')
    setShowSuggestions(false)
    setIsFilterOpen(false)
  }

  const searchModeOptions = [
    { key: 'general', label: t('search.mode.general', 'Genel') },
    { key: 'posts', label: t('search.mode.posts', 'Başlıklar') },
    { key: 'actors', label: t('search.mode.actors', 'Aktörler') },
    { key: 'tribes', label: t('search.mode.tribes', 'Tribeler') },
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

        {/* Bletchly Logo Resized */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0, // Sıfır boşluk
            cursor: 'pointer',
            flexShrink: 0,
            transform: 'scale(0.85)',
            transformOrigin: 'left center',
          }}
          onClick={() => navigate('/')}
        >
          <Logo width={36} height={48} fill="var(--color-primary)" />
          <span
            style={{
              fontWeight: 800,
              fontSize: 26,
              color: 'var(--color-primary)',
              marginTop: 4,
              marginLeft: -2,
            }}
          >
            letchly
          </span>
        </div>

        {/* Search Bar */}
        <form
          className="topbar-search-form"
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
              <span
                style={{
                  fontSize: 9,
                  display: 'inline-block',
                  transform: searchModeDropdown ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                ▼
              </span>
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
              placeholder={t('topbar.search')}
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
                                {t('common.actors', 'Aktörler')}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {suggestions.actors.slice(0, 3).map((actor) => (
                                  <div
                                    key={actor.actorId}
                                    className="lb-card"
                                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                                    onClick={() => {
                                      setSearchQuery('')
                                      setShowSuggestions(false)
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <ActorMinimalCard actor={actor} />
                                    </div>
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
                                {t('common.tribes', 'Tribeler')}
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
                                {t('common.posts', 'Başlıklar')}
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
                                {t('search.no_results', 'Sonuç bulunamadı')}
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
                                  className="lb-card"
                                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                                  onClick={() => {
                                    setSearchQuery('')
                                    setShowSuggestions(false)
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <ActorMinimalCard actor={actor} />
                                  </div>
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
                              {t('search.no_results', 'Sonuç bulunamadı')}
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
                searchMode === 'general'
                  ? t('topbar.general_search_no_filter')
                  : t('topbar.search_filters')
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
                    {t('search.filters_title', 'Arama Filtreleri')}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {t('search.sort_by', 'Sıralama')}
                    </label>
                    <select
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13 }}
                      value={filterOrderType}
                      onChange={handleOrderTypeChange}
                    >
                      <option value="">{t('topbar.default', 'Varsayılan')}</option>
                      {searchMode === 'posts' && (
                        <option value="MostLiked">
                          {t('topbar.most_liked', 'En Çok Beğenilen')}
                        </option>
                      )}
                      <option value="Newest">{t('sort.newest')}</option>
                      <option value="Oldest">{t('topbar.oldest', 'En Eski')}</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {t('search.start_date', 'Başlangıç Tarihi')}
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
                      {t('search.end_date', 'Bitiş Tarihi')}
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
            {t('topbar.search')}
          </button>
        </form>

        {/* Right: user info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            marginLeft: 'auto',
          }}
        >
          {/* Hakan Davdav Linkleri */}
          <div
            className="hide-under-900"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Hakan Davdav
            </span>
            <a
              href="https://www.linkedin.com/in/hakan-davdav-0ba19629a/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                transform: 'translateY(-1px)',
              }}
              title="LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
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
              style={{
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                transform: 'translateY(-1px)',
              }}
              title="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
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
            <div
              style={{ width: 1, height: 28, background: 'var(--color-border)', margin: '0 4px' }}
            />

            <button
              className={`btn-icon ${
                isBotShaking ? (isGreenMode ? 'theme-toggle-to-green' : 'theme-toggle-to-blue') : ''
              }`}
              onClick={handleBotClick}
              title={isGreenMode ? 'Mavi Tema' : 'Yeşil Tema'}
              style={{ color: 'var(--color-primary)', height: 30, padding: '0 2px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <Bot size={18} strokeWidth={2.4} />
                <PaintbrushVertical size={15} strokeWidth={2.2} style={{ marginLeft: -5 }} />
              </span>
            </button>
            <button
              className="btn-icon"
              onClick={toggleTheme}
              title={isDarkMode ? 'Açık Tema' : 'Koyu Tema'}
              style={{
                color: isGreenMode ? '#10b981' : '#3b82f6',
                width: 30,
                height: 30,
                padding: 0,
              }}
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Language Selector */}
            <div style={{ position: 'relative' }} ref={langRef}>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setIsLangOpen((v) => !v)}
                style={{
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 5px',
                  height: 30,
                }}
              >
                {activeLangObj.flagUrl ? (
                  <img
                    src={activeLangObj.flagUrl}
                    alt={activeLangObj.code}
                    style={{ width: 19, height: 14, borderRadius: 2 }}
                  />
                ) : (
                  <span style={{ fontSize: 14 }}>{activeLangObj.fallbackEmoji || '🇹🇷'}</span>
                )}
              </button>
              <AnimatePresence>
                {isLangOpen && (
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
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 200,
                      minWidth: 115,
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {langs.map((l) => (
                      <button
                        key={l.code}
                        className={`btn ${currentLang === l.code ? 'btn-primary' : 'btn-ghost'}`}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '5px 10px',
                          gap: 7,
                        }}
                        onClick={() => {
                          i18n.changeLanguage(l.code)
                          setIsLangOpen(false)
                        }}
                      >
                        {l.flagUrl ? (
                          <img
                            src={l.flagUrl}
                            alt={l.code}
                            style={{ width: 19, height: 14, borderRadius: 2 }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 14,
                              display: 'inline-block',
                              width: 19,
                              textAlign: 'center',
                            }}
                          >
                            {l.fallbackEmoji}
                          </span>
                        )}
                        <span style={{ fontSize: 12.5 }}>{l.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              style={{ width: 1, height: 28, background: 'var(--color-border)', margin: '0 4px' }}
            />
          </div>

          {isLoggedIn ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ActorMinimalCard
                  actor={myProfile}
                  showHierarchyBtn={false}
                  clickable={true}
                  chipStyle={{ minWidth: 110, maxWidth: 205, fontSize: 12.5 }}
                />
              </div>

              <button
                className="btn-icon"
                onClick={() => logoutMutation.mutate()}
                title={t('topbar.logout')}
                style={{ width: 30, height: 30, padding: 0 }}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/login')}
                style={{ fontSize: 12.5, padding: '4px 10px', height: 30 }}
              >
                {t('topbar.login')}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/register')}
                style={{ fontSize: 12.5, padding: '4px 10px', height: 30 }}
              >
                {t('topbar.register')}
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
          gap: 6,
          overflowX: 'auto',
        }}
      >
        {/* Cache buttons */}
        <button
          className={`btn ${activeLeftCacheType === 'trending' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => setActiveLeftCacheType('trending')}
        >
          {t('sort.popular', 'Popüler')}
        </button>
        <button
          className={`btn ${activeLeftCacheType === 'recent' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => setActiveLeftCacheType('recent')}
        >
          {t('sort.new')}
        </button>
        <button
          className={`btn ${activeLeftCacheType === 'mostLiked' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => setActiveLeftCacheType('mostLiked')}
          title={t('sort.best_desc', 'dünün en beğenilenleri')}
        >
          {t('sort.best', 'En İyiler')}
        </button>
        <button
          className={`btn ${activeLeftCacheType === 'mostDisliked' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => setActiveLeftCacheType('mostDisliked')}
          title={t('sort.worst_desc', 'dünün en nefret edilenleri')}
        >
          {t('sort.worst', 'En Kötüler')}
        </button>

        <div style={{ width: 1, height: 32, background: 'var(--color-border)', margin: '0 8px' }} />

        {/* My Tribes & My Bots dropdowns */}
        {isLoggedIn && (
          <>
            <div
              className="hide-under-900"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginLeft: 6,
                flexShrink: 0,
                height: 36,
              }}
            >
              {/* My Tribes */}
              <div style={{ position: 'relative' }} ref={myTribesRef}>
                <button
                  className="btn btn-outline"
                  style={{ width: 84, padding: '3px 6px', fontSize: 11 }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTribesDropdownPos({ top: rect.bottom + 4, left: rect.left })
                    setIsMyTribesOpen((v) => !v)
                    setIsMyBotsOpen(false)
                    setBotsDropdownPos(null)
                  }}
                >
                  {t('common.tribes', 'Tribes')}{' '}
                  <span
                    style={{
                      fontSize: 9,
                      display: 'inline-block',
                      transform: isMyTribesOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform var(--transition-fast)',
                    }}
                  >
                    ▼
                  </span>
                </button>
                <AnimatePresence>
                  {isMyTribesOpen && tribesDropdownPos && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClickCapture={() => {
                        setIsMyTribesOpen(false)
                        setTribesDropdownPos(null)
                      }}
                      style={{
                        position: 'fixed',
                        top: tribesDropdownPos.top,
                        left: tribesDropdownPos.left,
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 12,
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 200,
                        minWidth: 400,
                        maxWidth: 400,
                        maxHeight: 320,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        padding: 8,
                      }}
                    >
                      {myTribes?.map((tData) => (
                        <div
                          key={tData.tribeId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            margin: '4px 0',
                            cursor: 'pointer',
                            minWidth: 0,
                          }}
                          onClick={() => {
                            setIsMyTribesOpen(false)
                            setTribesDropdownPos(null)
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <TribeMinimalCard {...tData} />
                          </div>
                        </div>
                      ))}
                      {(!myTribes || myTribes.length === 0) && (
                        <p className="text-muted" style={{ padding: 8, textAlign: 'center' }}>
                          {t('topbar.no_tribe')}
                        </p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginTop: 8,
                          marginBottom: 4,
                        }}
                      >
                        <button
                          onClick={() => {
                            navigate('/create-tribe')
                            setIsMyTribesOpen(false)
                            setTribesDropdownPos(null)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={t('topbar.new_tribe')}
                        >
                          <CirclePlus size={19} strokeWidth={2.4} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* My Bots */}
              <div style={{ position: 'relative' }} ref={myBotsRef}>
                <button
                  className="btn btn-outline"
                  style={{ width: 84, padding: '3px 6px', fontSize: 11 }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setBotsDropdownPos({ top: rect.bottom + 4, left: rect.left })
                    setIsMyBotsOpen((v) => !v)
                    setIsMyTribesOpen(false)
                    setTribesDropdownPos(null)
                  }}
                >
                  {t('common.bots', 'Bots')}{' '}
                  <span
                    style={{
                      fontSize: 9,
                      display: 'inline-block',
                      transform: isMyBotsOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform var(--transition-fast)',
                    }}
                  >
                    ▼
                  </span>
                </button>
                <AnimatePresence>
                  {isMyBotsOpen && botsDropdownPos && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClickCapture={() => {
                        setIsMyBotsOpen(false)
                        setBotsDropdownPos(null)
                      }}
                      style={{
                        position: 'fixed',
                        top: botsDropdownPos.top,
                        left: botsDropdownPos.left,
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 12,
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 200,
                        minWidth: 300,
                        maxWidth: 300,
                        maxHeight: 320,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        padding: 8,
                      }}
                    >
                      {myBots?.map((b) => (
                        <div
                          key={b.actorId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            margin: '4px 0',
                            cursor: 'pointer',
                            minWidth: 0,
                          }}
                          onClick={() => {
                            setIsMyBotsOpen(false)
                            setBotsDropdownPos(null)
                          }}
                        >
                          <div
                            className="lb-card"
                            style={{ flex: 1, padding: '8px 16px', minWidth: 0 }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <ActorMinimalCard actor={b} clickable={true} />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!myBots || myBots.length === 0) && (
                        <p className="text-muted" style={{ padding: 8, textAlign: 'center' }}>
                          {t('topbar.no_bot')}
                        </p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginTop: 8,
                          marginBottom: 4,
                        }}
                      >
                        <button
                          onClick={() => {
                            navigate('/create-bot')
                            setIsMyBotsOpen(false)
                            setBotsDropdownPos(null)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={t('topbar.new_bot')}
                        >
                          <CirclePlus size={19} strokeWidth={2.4} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                className="btn btn-outline"
                style={{ width: 84, padding: '3px 6px', fontSize: 11 }}
                onClick={() => navigate('/cards')}
              >
                {t('card.cards', 'Cards')}
              </button>

              {import.meta.env.VITE_IS_ADMIN_BUILD === 'true' && isAdmin && (
                <button
                  className="btn btn-outline"
                  style={{ width: 84, padding: '3px 6px', fontSize: 11 }}
                  onClick={() => navigate('/admin/panel')}
                  title="Admin Panel"
                >
                  Admin
                </button>
              )}
            </div>
          </>
        )}

        {isLoggedIn && (
          <div
            className="hide-under-900"
            style={{ width: 1, height: 30, background: 'var(--color-border)', margin: '0 8px' }}
          />
        )}

        <div
          className="hide-under-900"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            flexShrink: 0,
            height: 38,
          }}
        >
          <IconActionButton
            onClick={() => navigate('/leaderboard?type=user')}
            title={t('topbar.leaderboard', 'Liderlik Tablosu')}
            aria-label={t('topbar.leaderboard', 'Liderlik Tablosu')}
            style={{ width: 38, height: 38, boxSizing: 'border-box' }}
          >
            <Podium size={19} strokeWidth={2.2} />
          </IconActionButton>

          <IconActionButton
            onClick={() => navigate('/marketplace')}
            title={t('card.marketplace', 'Kart Marketi')}
            aria-label={t('card.marketplace', 'Kart Marketi')}
            style={{ width: 38, height: 38, boxSizing: 'border-box' }}
          >
            <BotFlashCardsIcon size={24} />
          </IconActionButton>

          <HowItWorksHelp
            title={t('bot.how_it_works', 'Nasıl çalışır?')}
            items={[
              t('bot.how_it_works_1'),
              t('bot.how_it_works_2'),
              t('bot.how_it_works_3'),
              t('bot.how_it_works_4'),
            ]}
            closeLabel={t('common.close', 'Kapat')}
            triggerLabel={t('bot.how_it_works', 'Nasıl çalışır?')}
            triggerStyle={{ width: 38, height: 38, boxSizing: 'border-box' }}
          />
        </div>
      </div>
    </header>
  )
}
