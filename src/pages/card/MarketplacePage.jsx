import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { personalityCardApi } from '../../api/personalityCardApi'
import { searchApi } from '../../api/searchApi'
import { ShoppingCart, Store, Search as SearchIcon, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../../components/common/BackButton'
import PersonalityCard from '../../components/card/PersonalityCard'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  // Search state
  const [searchInput, setSearchInput] = useState('')
  const [filterOrderType, setFilterOrderType] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef(null)

  // Active query parameters that trigger refetch
  const [activeParams, setActiveParams] = useState({ query: '', orderType: '' })

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: marketplaceCards, isLoading, refetch } = useQuery({
    queryKey: ['marketplaceCards', activeParams],
    queryFn: () => searchApi.filterCards(activeParams).then(res => res.data?.data || [])
  })
  
  const buyMutation = useMutation({
    mutationFn: (cardId) => personalityCardApi.buyCard(cardId),
    onSuccess: () => {
      toast.success(t('card.buy_success', 'Kart başarıyla satın alındı!'))
      refetch()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('common.error', 'Satın alma başarısız oldu'))
    }
  })
  
  const handleBuy = (cardId, price) => {
    if (window.confirm(t('card.confirm_buy', 'Bu kartı {{price}} ActorPoint karşılığında satın almak istiyor musunuz?', { price }))) {
      buyMutation.mutate(cardId)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setActiveParams({
      query: searchInput,
      orderType: filterOrderType || 'None'
    })
    setIsFilterOpen(false)
  }
  
  return (
    <div className="flex-col gap-4">
      <div className="px-2" style={{ marginBottom: 16 }}>
        <BackButton text={t('common.go_back', 'Geri Dön')} onClick={() => navigate(-1)} style={{ marginBottom: 0 }} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 24,
      }}>
        <div className="page-header-icon">
          <Store size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('card.marketplace', 'Kart Marketi')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('card.marketplace_desc', 'Diğer kullanıcıların oluşturduğu kişilik kartlarını keşfedin')}
          </p>
        </div>
      </div>

      {/* Advanced Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        style={{ display: 'flex', gap: 6, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}
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
            placeholder={t('card.search_marketplace', 'Marketteki kartlarda ara...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Filter button */}
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button
            type="button"
            className="btn btn-outline btn-icon"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            title={t('topbar.search_filters', 'Arama Filtreleri')}
            style={{ height: '40px', width: '40px' }}
          >
            <Filter size={16} />
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
                    onChange={(e) => setFilterOrderType(e.target.value)}
                  >
                    <option value="">{t('topbar.default', 'Varsayılan (En Popüler)')}</option>
                    <option value="Newest">{t('sort.newest', 'En Yeni')}</option>
                    <option value="Oldest">{t('topbar.oldest', 'En Eski')}</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>
          {t('topbar.search', 'Ara')}
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>{t('common.loading', 'Yükleniyor...')}</div>
        ) : marketplaceCards?.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>{t('card.no_marketplace_cards', 'Markette henüz kart bulunmuyor veya aramanızla eşleşen sonuç yok.')}</div>
        ) : (
          marketplaceCards?.map(card => (
            <div key={card.cardId} style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <PersonalityCard card={card} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                {/* Only show price if isListedOnMarketplace is true */}
                {card.isListedOnMarketplace ? (
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {card.price} AP
                  </span>
                ) : (
                  <span></span> /* Placeholder for space-between */
                )}
                <span style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
                  {t('card.sales', 'Satış')}: {card.ownershipCount || 0}
                </span>
              </div>
              
              <button 
                className="btn btn-sm btn-primary w-full"
                onClick={() => handleBuy(card.cardId, card.price)}
                disabled={buyMutation.isPending || !card.isListedOnMarketplace}
              >
                <ShoppingCart size={14} style={{ marginRight: 4 }} /> {t('card.buy', 'Satın Al')}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
