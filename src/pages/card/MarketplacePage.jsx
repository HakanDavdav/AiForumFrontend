import { useQuery, useMutation } from '@tanstack/react-query'
import { personalityCardApi } from '../../api/personalityCardApi'
import { ShoppingCart, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  const { data: marketplaceCards, isLoading, refetch } = useQuery({
    queryKey: ['marketplaceCards'],
    queryFn: () => personalityCardApi.getMarketplaceCards().then(res => res.data?.data?.items || [])
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
  
  return (
    <div className="flex-col gap-4">
      <div className="px-2" style={{ marginBottom: 16 }}>
        <BackButton text={t('common.go_back', 'Geri Dön')} onClick={() => navigate(-1)} style={{ marginBottom: 0 }} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '1px solid var(--color-border)'
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>{t('common.loading', 'Yükleniyor...')}</div>
        ) : marketplaceCards?.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>{t('card.no_marketplace_cards', 'Markette henüz kart bulunmuyor.')}</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{card.cardName}</h3>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {card.price} AP
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', flex: 1 }}>
                {card.cardHint || card.personalityPrompt}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
                  Satış: {card.salesCount}
                </span>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => handleBuy(card.cardId, card.price)}
                  disabled={buyMutation.isPending}
                >
                  <ShoppingCart size={14} style={{ marginRight: 4 }} /> {t('card.buy', 'Satın Al')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
