import { useState, useRef, useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search as SearchIcon, Filter, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import BackButton from '../components/common/BackButton'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import { tribeApi } from '../api/tribeApi'

export default function TribesPage() {
  const { t } = useTranslation()

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('')
  const [filterOrderType, setFilterOrderType] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef(null)

  // Active query parameters that trigger refetch
  const [activeParams, setActiveParams] = useState({
    query: '',
    orderType: '',
    startDate: null,
    endDate: null,
  })

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['tribesList', activeParams],
    queryFn: ({ pageParam = 1 }) =>
      tribeApi
        .loadTribes(
          pageParam,
          activeParams.query,
          activeParams.orderType,
          activeParams.startDate,
          activeParams.endDate
        )
        .then((res) => res.data?.data || []),
    getNextPageParam: (lastPage, allPages) => {
      if (activeParams.query) return undefined
      return lastPage.length === 20 ? allPages.length + 1 : undefined
    },
  })

  const allFetchedTribes = data?.pages.flatMap((p) => p) || []

  // Frontend simulated pagination state
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => {
    setVisibleCount(20)
  }, [activeParams])

  const visibleTribes = allFetchedTribes.slice(0, visibleCount)

  const loadMoreRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (visibleCount < allFetchedTribes.length) {
            setVisibleCount((prev) => prev + 20)
          } else if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage().then(() => {
              setVisibleCount((prev) => prev + 20)
            })
          }
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [visibleCount, allFetchedTribes.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setActiveParams({
      query: searchInput,
      orderType: filterOrderType || 'None',
      startDate: filterStartDate || null,
      endDate: filterEndDate || null,
    })
    setIsFilterOpen(false)
  }

  return (
    <div
      className="flex-col gap-4"
      style={{ paddingBottom: 60, maxWidth: 1200, margin: '0 auto', width: '100%' }}
    >
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 12 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Advanced Search Bar matching TopBar & MarketplacePage */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <SearchIcon
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
            placeholder={t('tribe.search_placeholder', 'Klanlarda ara...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Filter button & Dropdown */}
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            title={t('topbar.search_filters', 'Arama Filtreleri')}
            style={{
              borderColor: (filterOrderType || filterStartDate || filterEndDate) ? 'var(--color-primary)' : undefined,
            }}
          >
            <Filter
              size={14}
              color={(filterOrderType || filterStartDate || filterEndDate) ? 'var(--color-primary)' : 'currentColor'}
              fill={(filterOrderType || filterStartDate || filterEndDate) ? 'var(--color-primary)' : 'none'}
            />
          </button>
          {(filterOrderType || filterStartDate || filterEndDate) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setFilterOrderType('')
                setFilterStartDate('')
                setFilterEndDate('')
                setIsFilterOpen(false)
              }}
              title={t('common.clear_all', 'Tümünü Temizle')}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                transform: 'none',
                marginTop: 0,
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 14,
                height: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                zIndex: 10,
              }}
            >
              <X size={10} strokeWidth={3} />
            </button>
          )}
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
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    borderBottom: '1px solid var(--color-border-light)',
                    paddingBottom: 6,
                  }}
                >
                  <span>{t('search.filters_title', 'Arama Filtreleri')}</span>
                  <X
                    size={14}
                    color="var(--color-text-secondary)"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsFilterOpen(false)}
                  />
                </div>

                {/* OrderType selection: only Crowded, Newest, Oldest */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {t('search.sort_by', 'Sıralama')}
                  </label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <select
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                      value={filterOrderType}
                      onChange={(e) => setFilterOrderType(e.target.value)}
                    >
                      <option value="">{t('search.none', 'Yok')}</option>
                      <option value="Crowded">
                        {t('tribe.most_crowded', 'En Kalabalık')}
                      </option>
                      <option value="Newest">{t('sort.newest', 'En Yeni')}</option>
                      <option value="Oldest">{t('topbar.oldest', 'En Eski')}</option>
                    </select>
                    {filterOrderType && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                        onClick={() => setFilterOrderType('')}
                        title={t('common.clear', 'Temizle')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Start Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {t('search.start_date', 'Başlangıç Tarihi')}
                  </label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="date"
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                    {filterStartDate && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                        onClick={() => setFilterStartDate('')}
                        title={t('common.clear', 'Temizle')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* End Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {t('search.end_date', 'Bitiş Tarihi')}
                  </label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="date"
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                    {filterEndDate && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                        onClick={() => setFilterEndDate('')}
                        title={t('common.clear', 'Temizle')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: 4, paddingTop: 7, paddingBottom: 7 }}
                >
                  {t('topbar.search_button', 'Ara')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button type="submit" className="btn btn-primary btn-sm">
          {t('topbar.search_button', 'Ara')}
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center" style={{ padding: 60 }}>
          <Loader2 size={28} className="spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      ) : visibleTribes.length === 0 ? (
        <p className="empty-state">{t('tribes_page.empty', 'Henüz klan bulunmuyor.')}</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {visibleTribes.map((tr) => (
            <TribeMinimalCard
              key={tr.tribeId || tr.TribeId}
              tribeId={tr.tribeId || tr.TribeId}
              tribeName={tr.tribeName || tr.TribeName}
              tribePoint={tr.tribePoint ?? tr.tribeActorPoint ?? tr.TribeActorPoint}
              imageUrl={tr.imageUrl || tr.ImageUrl}
            />
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={loadMoreRef} style={{ height: 20 }} />
      {isFetchingNextPage && (
        <div className="flex justify-center" style={{ padding: 20 }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}
    </div>
  )
}
