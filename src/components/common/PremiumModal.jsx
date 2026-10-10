import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Crown,
  Loader2,
  Bot,
  Lock,
  Users,
  Brain,
  Check,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import CardContingencyIcon from './icons/CardContingencyIcon'
import BotFlashCardsIcon from './icons/BotFlashCardsIcon'
import AngryBotWithSwordsIcon from './icons/AngryBotWithSwordsIcon'
import KingIcon from './icons/KingIcon'
import KingSvg from '../../assets/King.svg?react'
import ModalHeader from './ModalHeader'
import SelectionMarker from './SelectionMarker'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { paymentApi } from '../../api/paymentApi'
import useAuthStore from '../../store/authStore'
import { UserCapabilities } from '../../constants/enums'
import { trackBeginCheckout } from '../../utils/analytics'
import mindThemeImg from '../../assets/media_1789577512893.jpg'
import hierarchyThemeImg from '../../assets/media_1789577513208.jpg'
import botsThemeImg from '../../assets/media_1789577513370.jpg'

function FramedThemeIcon({ type, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <rect x="1.5" y="1.5" width="21" height="21" rx="4.5" strokeWidth="1.6" />
      <g transform="translate(3.6, 3.6) scale(0.7)">
        {type === 'brain' && (
          <>
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
            <path d="M6 18a4 4 0 0 1-1.967-.516" />
            <path d="M19.967 17.484A4 4 0 0 1 18 18" />
          </>
        )}
        {(type === 'hierarchy' || type === 'network') && (
          <>
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <rect x="9" y="2" width="6" height="6" rx="1" />
            <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
            <path d="M12 12V8" />
          </>
        )}
        {type === 'bot' && (
          <>
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </>
        )}
      </g>
    </svg>
  )
}

export default function PremiumModal({ isOpen, onClose }) {
  const titleId = useId()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const actorId = useAuthStore((s) => s.actorId)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const [isLoading, setIsLoading] = useState(false)
  const [activeThemeIndex, setActiveThemeIndex] = useState(0)
  const [billingCycle, setBillingCycle] = useState('annual')
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

  // Aktif kullanıcı profil bilgisi (UserCapabilities.Premium kontrolü)
  const { data: userProfile } = useQuery({
    queryKey: ['actorProfile', actorId],
    enabled: !!actorId && isOpen,
    staleTime: 30000,
  })

  // Güncel abonelik detayları
  const {
    data: subStatus,
    isLoading: isStatusLoading,
  } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: async () => {
      const res = await paymentApi.getSubscriptionStatus()
      return res.data?.data
    },
    enabled: !!actorId && isOpen,
    staleTime: 10000,
  })

  const isProfilePremium =
    ((userProfile?.userSettings?.userCapabilities ?? UserCapabilities.Default) &
      UserCapabilities.Premium) ===
    UserCapabilities.Premium

  const isPremiumActive =
    Boolean(subStatus?.isPremium) || isProfilePremium || subStatus?.status === 1

  const isCanceledAtPeriodEnd =
    Boolean(subStatus?.cancelAtPeriodEnd) || subStatus?.status === 3

  // Abonelik iptal mutasyonu
  const cancelMutation = useMutation({
    mutationFn: () => paymentApi.cancelSubscription(),
    onSuccess: () => {
      toast.success(t('premium.cancel_success', 'Aboneliğiniz başarıyla iptal edildi.'))
      setIsConfirmingCancel(false)
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
    },
    onError: (err) => {
      const msg =
        err.response?.data?.errors?.[0]?.description ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        t('premium.cancel_failed', 'Abonelik iptal edilemedi.')
      toast.error(msg)
    },
  })

  // Stripe Portal mutasyonu
  const portalMutation = useMutation({
    mutationFn: () => paymentApi.createCustomerPortal(),
    onSuccess: (res) => {
      const portalUrl = res.data?.data?.portalUrl
      if (portalUrl) {
        window.location.href = portalUrl
      } else {
        toast.error(t('premium.portal_failed', 'Stripe müşteri paneline ulaşılamadı.'))
      }
    },
    onError: (err) => {
      const msg =
        err.response?.data?.errors?.[0]?.description ||
        err.response?.data?.errors?.[0]?.message ||
        t('premium.portal_failed', 'Stripe müşteri paneline ulaşılamadı.')
      toast.error(msg)
    },
  })

  const profileThemes = [
    {
      id: 'mind',
      title: t('premium.theme_mind_title', 'Mind Network'),
      desc: t('premium.theme_mind_desc', 'Dinamik nöron ağı ve bağlantı grafiği teması'),
      img: mindThemeImg,
    },
    {
      id: 'hierarchy',
      title: t('premium.theme_hierarchy_title', 'Hiyerarşi Ağacı'),
      desc: t('premium.theme_hierarchy_desc', 'Ağaç ve organizasyonel yapı grafiği teması'),
      img: hierarchyThemeImg,
    },
    {
      id: 'bots',
      title: t('premium.theme_bots_title', 'Yüzen Botlar'),
      desc: t('premium.theme_bots_desc', 'Etkileşimli süzülen bot parçacıkları ambiyansı'),
      img: botsThemeImg,
    },
  ]

  const handleCheckout = async () => {
    try {
      setIsLoading(true)
      const isAnnual = billingCycle === 'annual'
      trackBeginCheckout({
        plan: isAnnual ? 'premium_annual' : 'premium_monthly',
        payment_type: 'subscription',
      })
      const res = await paymentApi.createCheckoutSession({ paymentType: isAnnual ? 1 : 0 })
      const checkoutUrl = res.data?.data?.checkoutUrl
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        toast.error(t('premium.checkout_failed', 'Ödeme oturumu başlatılamadı.'))
      }
    } catch (err) {
      console.error(err)
      toast.error(
        err.message ||
          err.response?.data?.errors?.[0]?.description ||
          err.response?.data?.errors?.[0]?.message ||
          t('premium.checkout_failed', 'Ödeme oturumu başlatılamadı.')
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingCancel(false)
      return undefined
    }
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const perks = [
    {
      icon: <Bot size={16} color="var(--color-primary)" />,
      badge: '+4',
      title: t('premium.perk_bots_title', '+4 Bot Oluşturma Limiti'),
      desc: t('premium.perk_bots_desc', 'Ekstra 4 bot üretme ve yönetme kapasitesi.'),
    },
    {
      icon: <BotFlashCardsIcon size={16} color="var(--color-primary)" />,
      badge: '+4',
      title: t('premium.perk_cards_title', '+4 Kart Sahiplik Limiti'),
      desc: t('premium.perk_cards_desc', 'Envanterde daha fazla kişilik kartı barındırma hakkı.'),
    },
    {
      icon: <Lock size={16} color="var(--color-primary)" />,
      badge: '+4',
      title: t('premium.perk_locks_title', '+4 Kart Kilitleme Slotu'),
      desc: t('premium.perk_locks_desc', 'Kişilik kartı atamalarını otomatik tasfiyeden koruma hakkı.'),
    },
    {
      icon: <Users size={16} color="var(--color-primary)" />,
      badge: '+4',
      title: t('premium.perk_tribes_title', '+4 Klan Kurma Limiti'),
      desc: t('premium.perk_tribes_desc', 'Topluluklar oluşturmak için ek klan slotları.'),
    },
    {
      icon: <AngryBotWithSwordsIcon size={18} style={{ color: 'var(--color-primary)' }} />,
      badge: '+4',
      title: t('premium.perk_debates_title', '+4 Günlük Meydan Okuma Limiti'),
      desc: t('premium.perk_debates_desc', 'Her gün eşzamanlı ek meydan okuma ve tartışma hakkı.'),
    },
    {
      icon: <CardContingencyIcon size={13} color="var(--color-primary)" />,
      badge: '+%4',
      title: t('premium.perk_inheritance_title', '+%4 Kart Miras Şansı'),
      desc: t('premium.perk_inheritance_desc', 'Etkileşimlerde yeni kart türeme ve kalıtım olasılığı artışı.'),
    },
  ]

  const formattedPeriodEnd = subStatus?.currentPeriodEnd
    ? new Date(subStatus.currentPeriodEnd).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const isAnnualPlan = subStatus?.paymentType === 1
  const planName = isAnnualPlan
    ? t('premium.plan_annual_label', 'Yıllık Abonelik')
    : t('premium.plan_label', 'Aylık Abonelik')
  const planPriceText = isAnnualPlan ? '$42 / yıl' : '$5 / ay'

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
      }}
      role="presentation"
    >
      <section
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(820px, calc(100vw - 32px))',
          maxWidth: 'none',
          maxHeight: '92vh',
          padding: 0,
          borderRadius: 20,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <ModalHeader
          icon={<Crown size={28} color="#F59E0B" />}
          title="Premium"
          subtitle={
            isPremiumActive
              ? null
              : t(
                  'premium.subtitle',
                  'Üst düzey limitler ve özel ayrıcalıklarla platformun gücünü açığa çıkarın.'
                )
          }
          titleId={titleId}
          onClose={onClose}
        />

        {/* Body */}
        {isPremiumActive ? (
          /* ========================================================================= */
          /* PREMIUM AKTİF GÖRÜNÜMÜ                                                     */
          /* ========================================================================= */
          <div
            style={{
              padding: '18px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* 1. KOCAMAN PREMIUM KING BOT SVG (Modalin En Üstünde) */}
            <div
              style={{
                borderRadius: 18,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                background:
                  'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.16) 0%, rgba(59, 130, 246, 0.08) 55%, var(--color-surface) 100%)',
                border: '1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border))',
                boxShadow: '0 12px 36px -10px rgba(245, 158, 11, 0.22)',
              }}
            >
              {/* Arka Plan Işık Halkası */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  filter: 'blur(20px)',
                }}
              />

              {/* KOCAMAN KING BOT SVG */}
              <div
                style={{
                  position: 'relative',
                  filter: 'drop-shadow(0 10px 22px rgba(245, 158, 11, 0.32))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)'
                }}
              >
                <KingSvg
                  width={150}
                  height={205}
                  style={{
                    display: 'block',
                    width: 150,
                    height: 205,
                  }}
                />
              </div>
            </div>

            {/* 2. Güncel Abonelik Durum Kartı (Premium Bilgilendirme Bloğu) */}
            <div
              style={{
                borderRadius: 16,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.15)',
                flexShrink: 0,
              }}
            >
              {/* Durum Rozeti ve Başlık */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isCanceledAtPeriodEnd
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isCanceledAtPeriodEnd ? (
                      <AlertTriangle size={20} color="#F59E0B" />
                    ) : (
                      <ShieldCheck size={20} color="var(--color-primary)" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {t('premium.current_status', 'Abonelik Durumu')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {isCanceledAtPeriodEnd
                        ? t(
                            'premium.status_canceled_desc',
                            'Abonelik yenilenmesi durduruldu. Dönem sonuna kadar ayrıcalıklarınız geçerlidir.'
                          )
                        : t(
                            'premium.status_active_desc',
                            'Premium üyeliğiniz aktif. Otomatik yenilenme ve tüm ayrıcalıklar devrede.'
                          )}
                    </div>
                  </div>
                </div>

                {isCanceledAtPeriodEnd && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(245, 158, 11, 0.14)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#F59E0B',
                        boxShadow: '0 0 8px #F59E0B',
                      }}
                    />
                    {t('premium.status_canceled', 'Dönem Sonunda İptal Olacak')}
                  </div>
                )}
              </div>

              {/* Detay Bilgi Blokları */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                  paddingTop: 8,
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                {/* Plan Bilgisi */}
                <div
                  style={{
                    background: 'var(--color-surface-2)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {t('premium.plan', 'Plan')}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {planName}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>
                    {planPriceText}
                  </span>
                </div>

                {/* Bitiş / Yenilenme Tarihi */}
                <div
                  style={{
                    background: 'var(--color-surface-2)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {isCanceledAtPeriodEnd
                      ? t('premium.period_end_canceled', 'Bitiş Tarihi')
                      : t('premium.period_end_active', 'Sonraki Yenilenme')}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {formattedPeriodEnd || t('premium.active_period', 'Aktif Dönem')}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {isCanceledAtPeriodEnd
                      ? t('premium.will_downgrade', 'Bu tarihte standart plana dönülür')
                      : t('premium.auto_renew', 'Otomatik yenilenir')}
                  </span>
                </div>

                {/* Ödeme Altyapısı */}
                <div
                  style={{
                    background: 'var(--color-surface-2)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {t('premium.provider', 'Ödeme Sağlayıcı')}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Stripe Checkout
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {subStatus?.stripeSubscriptionId
                      ? `${subStatus.stripeSubscriptionId.slice(0, 14)}...`
                      : t('premium.secure_active', 'Doğrulanmış & Korumalı')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STANDART SATIN ALMA AKIŞI (PREMIUM OLMAYANLAR İÇİN)                        */
          /* ========================================================================= */
          <div
            style={{
              padding: '18px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Billing Cycle Selection Cards (Monthly vs Annual with 30% discount) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 12,
              }}
            >
              {/* Monthly Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setBillingCycle('monthly')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setBillingCycle('monthly')
                  }
                }}
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: 14,
                  background:
                    billingCycle === 'monthly'
                      ? 'color-mix(in srgb, var(--color-surface) 88%, var(--color-primary) 12%)'
                      : 'var(--color-surface)',
                  border:
                    billingCycle === 'monthly'
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                  boxShadow:
                    billingCycle === 'monthly'
                      ? '0 4px 18px -4px var(--color-primary-shadow, rgba(99, 102, 241, 0.25))'
                      : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 8,
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SelectionMarker checked={billingCycle === 'monthly'} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {t('premium.plan_label', 'Aylık Abonelik')}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {t('premium.plan_cancel_anytime', 'İstediğiniz zaman iptal edebilirsiniz')}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginTop: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>$5</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      / {t('premium.month', 'ay')}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    $60 / {t('premium.year', 'yıl')}
                  </span>
                </div>
              </div>

              {/* Annual Card (30% Discount) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setBillingCycle('annual')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setBillingCycle('annual')
                  }
                }}
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: 14,
                  background:
                    billingCycle === 'annual'
                      ? 'color-mix(in srgb, var(--color-surface) 86%, var(--color-primary) 14%)'
                      : 'var(--color-surface)',
                  border:
                    billingCycle === 'annual'
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                  boxShadow:
                    billingCycle === 'annual'
                      ? '0 4px 22px -4px var(--color-primary-shadow, rgba(99, 102, 241, 0.35))'
                      : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 8,
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SelectionMarker checked={billingCycle === 'annual'} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {t('premium.plan_annual_label', 'Yıllık Abonelik')}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginTop: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>$3.50</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      / {t('premium.month', 'ay')}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    $42 / {t('premium.year', 'yıl')}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Exclusive Profile Themes Showcase */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {t('premium.themes_section_title', '3 Farklı Profil Görsel Tasarımı')}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      marginTop: 2,
                      lineHeight: 1.4,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {t(
                      'premium.themes_section_desc',
                      'Profiliniz ve botlarınız için herkes tarafından görülebilen\n3 benzersiz animasyonlu dinamik ambiyans başlık tasarımının kilidini açın.'
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <button
                    type="button"
                    className={`btn btn-sm ${activeThemeIndex === 0 ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveThemeIndex(0)}
                    aria-label={t('topbar.mind_ambience', 'Mind Arka Planı')}
                    style={{
                      width: 38,
                      height: 30,
                      minWidth: 0,
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      position: 'relative',
                      zIndex: activeThemeIndex === 0 ? 2 : 1,
                      ...(activeThemeIndex === 0
                        ? {}
                        : {
                            borderColor: 'var(--color-border-light)',
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-surface-2)',
                          }),
                    }}
                  >
                    <FramedThemeIcon type="brain" size={20} />
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeThemeIndex === 1 ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveThemeIndex(1)}
                    aria-label={t('topbar.welcome_ambience', 'Welcome Arka Planı')}
                    style={{
                      width: 38,
                      height: 30,
                      minWidth: 0,
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 0,
                      marginLeft: -1,
                      position: 'relative',
                      zIndex: activeThemeIndex === 1 ? 2 : 1,
                      ...(activeThemeIndex === 1
                        ? {}
                        : {
                            borderColor: 'var(--color-border-light)',
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-surface-2)',
                          }),
                    }}
                  >
                    <FramedThemeIcon type="hierarchy" size={20} />
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeThemeIndex === 2 ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveThemeIndex(2)}
                    aria-label={t('topbar.ambient_bots', 'Bot Arka Planı')}
                    style={{
                      width: 38,
                      height: 30,
                      minWidth: 0,
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      marginLeft: -1,
                      position: 'relative',
                      zIndex: activeThemeIndex === 2 ? 2 : 1,
                      ...(activeThemeIndex === 2
                        ? {}
                        : {
                            borderColor: 'var(--color-border-light)',
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-surface-2)',
                          }),
                    }}
                  >
                    <FramedThemeIcon type="bot" size={20} />
                  </button>
                </div>
              </div>

              {/* Visual Image Preview */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                  background: '#000',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={profileThemes[activeThemeIndex].img}
                  alt={profileThemes[activeThemeIndex].title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transition: 'opacity 0.2s ease',
                  }}
                />
              </div>
            </div>

            {/* Perks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {perks.map((perk, index) => (
                <div
                  key={index}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 10,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {perk.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {perk.title}
                      {perk.desc && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: 'var(--color-text-muted)',
                            marginLeft: 8,
                          }}
                        >
                          — {perk.desc}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-primary)',
                      flexShrink: 0,
                    }}
                  >
                    {perk.badge}
                  </span>
                </div>
              ))}
            </div>

            {/* Extra Highlights */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  background: 'color-mix(in srgb, var(--color-warning) 8%, var(--color-surface))',
                  border: '1px solid color-mix(in srgb, var(--color-warning) 24%, var(--color-border))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <KingIcon size={16} style={{ flexShrink: 0 }} />
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <strong style={{ color: 'var(--color-text-primary)' }}>
                    {t('premium.badge_highlight_title', 'Altın Taç Rozeti:')}
                  </strong>{' '}
                  {t('premium.badge_highlight_desc', 'Profilinizde özel rozet gösterilir.')}
                </div>
              </div>

              <div
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  background: 'color-mix(in srgb, var(--color-warning) 8%, var(--color-surface))',
                  border: '1px solid color-mix(in srgb, var(--color-warning) 24%, var(--color-border))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Brain size={18} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <strong style={{ color: 'var(--color-text-primary)' }}>
                    {t('premium.memory_highlight_title', 'Genişletilmiş Bot Hafızası:')}
                  </strong>{' '}
                  {t('premium.memory_highlight_desc', '+30 gün uzatılmış bot hafıza süresi.')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer (Aboneliği İptal Etme / Yönetim veya Satın Alma Butonu) */}
        <div
          style={{
            padding: '14px 24px 18px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {isPremiumActive ? (
            /* ========================================================================= */
            /* PREMIUM AKTİF FOOTER (ABONELİĞİ İPTAL ET BUTONU & YÖNETİM)               */
            /* ========================================================================= */
            isConfirmingCancel ? (
              /* İptal Onay Kutusu */
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'color-mix(in srgb, var(--color-danger, #ef4444) 10%, var(--color-surface))',
                  border: '1px solid color-mix(in srgb, var(--color-danger, #ef4444) 30%, var(--color-border))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <AlertTriangle size={18} color="var(--color-danger, #ef4444)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {t('premium.cancel_confirm_title', 'Aboneliğinizi iptal etmek istediğinize emin misiniz?')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {t(
                        'premium.cancel_confirm_desc',
                        'İptal ettiğinizde mevcut döneminizin sonuna kadar premium özellikleriniz devam edecek, ardından standart plana geçilecektir.'
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setIsConfirmingCancel(false)}
                    disabled={cancelMutation.isPending}
                    style={{ fontSize: 13, padding: '7px 14px' }}
                  >
                    {t('premium.cancel_abort_btn', 'Vazgeç')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    style={{
                      fontSize: 13,
                      padding: '7px 16px',
                      background: 'var(--color-danger, #ef4444)',
                      borderColor: 'var(--color-danger, #ef4444)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {cancelMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    {t('premium.cancel_confirm_btn', 'Evet, Aboneliği İptal Et')}
                  </button>
                </div>
              </div>
            ) : (
              /* Normal İptal & Yönet Butonları */
              <div
                className="premium-footer-actions"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                {/* Stripe Portal Butonu (Faturalar, Kart Güncelleme) */}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    padding: '8px 14px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {portalMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ExternalLink size={14} />
                  )}
                  {t('premium.manage_portal', 'Fatura & Kartı Yönet')}
                </button>

                {/* EN ALTTADA ABONELİĞİ İPTAL ETME BUTONU */}
                {isCanceledAtPeriodEnd ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onClose}
                    style={{
                      fontSize: 13,
                      padding: '8px 20px',
                    }}
                  >
                    {t('common.close', 'Kapat')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setIsConfirmingCancel(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--color-danger, #ef4444)',
                      color: 'var(--color-danger, #ef4444)',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '8px 18px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-danger, #ef4444)'
                      e.currentTarget.style.color = '#FFFFFF'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--color-danger, #ef4444)'
                    }}
                  >
                    {t('premium.cancel_subscription', 'Aboneliği İptal Et')}
                  </button>
                )}
              </div>
            )
          ) : (
            /* ========================================================================= */
            /* STANDART CHECKOUT FOOTER (PREMIUM OLMAYANLAR İÇİN)                        */
            /* ========================================================================= */
            <>
              <button
                type="button"
                className="btn"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: '#FFFFFF',
                  background:
                    'linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 50%, var(--color-primary-gradient-end) 100%)',
                  boxShadow: '0 4px 14px 0 var(--color-primary-shadow)',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1.5px)'
                    e.currentTarget.style.boxShadow = '0 6px 18px 0 var(--color-primary-shadow)'
                    e.currentTarget.style.filter = 'brightness(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 var(--color-primary-shadow)'
                    e.currentTarget.style.filter = 'none'
                  }
                }}
                disabled={isLoading}
                onClick={handleCheckout}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Crown size={18} />
                )}
                {isLoading
                  ? t('common.loading', 'Yükleniyor...')
                  : billingCycle === 'annual'
                    ? t('premium.checkout_cta_annual', "$42 / Yıl ile Premium'a Yükselt")
                    : t('premium.checkout_cta', "$5 / Ay ile Premium'a Yükselt")}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
              >
                <span>{t('premium.secure_payment', 'Güvenli Stripe Ödemesi')}</span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>,
    document.body
  )
}
