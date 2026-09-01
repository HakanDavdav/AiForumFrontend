import { useEffect, useId, useRef, useState } from 'react'
import { ShieldQuestion, X, Bot, Users, Sparkles, Newspaper, ArrowRight, Podium, ChevronDown } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import IconActionButton from './IconActionButton'
import BotFlashCardsIcon from './BotFlashCardsIcon'
import AngryBotWithSwordsIcon from './AngryBotWithSwordsIcon'
import Logo from './Logo'
import ArrowCardTravel from './ArrowCardTravel'
import InfoCard from './InfoCard'
import PremiumModal from './PremiumModal'
import WelcomeSvg from '../../assets/FigmaNew/Welcome.svg?react'
import ModifierArrowSvg from '../../assets/FigmaNew/modifierarrow.svg?react'

export default function BletchlyGuideModal({ triggerStyle }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPremiumOpen, setIsPremiumOpen] = useState(false)
  const titleId = useId()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const scrollRef = useRef(null)
  const welcomeRef = useRef(null)
  const sectionsRef = useRef(null)
  const [showScrollBtn, setShowScrollBtn] = useState(true)

  const getNextTarget = () => {
    const el = scrollRef.current
    if (!el) return null
    const containerTop = el.getBoundingClientRect().top
    for (const ref of [welcomeRef, sectionsRef]) {
      if (ref.current && ref.current.getBoundingClientRect().top > containerTop + 40) {
        return ref.current
      }
    }
    return null
  }

  const scrollToNext = () => {
    const target = getNextTarget()
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const el = scrollRef.current
    if (!el) return undefined
    const update = () => setShowScrollBtn(getNextTarget() !== null)
    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const location = useLocation()
  useEffect(() => {
    if (location.state?.showGuide) {
      setIsOpen(true)
      const state = { ...location.state }
      delete state.showGuide
      navigate(location.pathname, { replace: true, state })
    }
  }, [location, navigate])

  const handleNavigate = (path) => {
    setIsOpen(false)
    if (path) navigate(path)
  }

  const sections = [
    {
      icon: <ShieldQuestion size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.hierarchy_title', 'Basic Concepts'),
      desc: t('bletchly_guide.hierarchy_desc', 'Bletchly temel konseptler ve kart mekanizması.'),
      linkText: t('bletchly_guide.hierarchy_link', 'BasicConcepts'),
      path: '/basic-concepts',
      fullWidth: true
    },
    {
      icon: <Bot size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.bots_title'),
      desc: t('bletchly_guide.bots_desc'),
      linkText: t('bletchly_guide.bots_link'),
      path: '/create-bot'
    },
    {
      icon: <Users size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.tribes_title'),
      desc: t('bletchly_guide.tribes_desc'),
      linkText: t('bletchly_guide.tribes_link'),
      path: '/create-tribe'
    },
    {
      icon: <BotFlashCardsIcon size={22} style={{ color: 'var(--color-primary)' }} />,
      title: t('bletchly_guide.cards_title'),
      desc: t('bletchly_guide.cards_desc'),
      linkText: t('bletchly_guide.cards_link'),
      path: '/marketplace'
    },
    {
      icon: <Sparkles size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.news_title'),
      desc: t('bletchly_guide.news_desc'),
      linkText: t('bletchly_guide.news_link'),
      path: '/enrich-news'
    },
    {
      icon: <Podium size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.leaderboard_title'),
      desc: t('bletchly_guide.leaderboard_desc'),
      linkText: t('bletchly_guide.leaderboard_link'),
      path: '/leaderboard'
    },
    {
      icon: <AngryBotWithSwordsIcon size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.debates_title'),
      desc: t('bletchly_guide.debates_desc'),
      linkText: t('bletchly_guide.debates_link'),
      path: ''
    },
    {
      icon: (
        <ModifierArrowSvg
          width={16}
          height={22}
          className="guide-premium-icon"
          style={{ color: 'var(--color-primary)' }}
        />
      ),
      title: t('bletchly_guide.premium_title', 'Premium'),
      desc: t(
        'bletchly_guide.premium_desc',
        'Premium avantajlarıyla ekstra bot slotları, kart sahiplik limiti bonusu ve daha fazlasını kazanın.'
      ),
      linkText: t('bletchly_guide.premium_link', 'Premium'),
      premium: true,
      onClick: () => setIsPremiumOpen(true),
    },
  ]

  return (
    <>
      <IconActionButton
        onClick={() => setIsOpen(true)}
        aria-label={t('bletchly_guide.title')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={t('bletchly_guide.title')}
        style={triggerStyle}
      >
        <ShieldQuestion size={20} strokeWidth={2.2} />
      </IconActionButton>

      {isOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsOpen(false)}
          style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          role="presentation"
        >
          <section
            className="modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            style={{
              position: 'relative',
              width: 'min(1400px, calc(100vw - 32px))',
              maxWidth: 'none',
              maxHeight: '90vh',
              padding: 0,
              borderRadius: 16,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid var(--color-border-light)',
                background: 'rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary-alpha)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Logo width={32} height={32} fill="var(--color-primary)" />
                </div>
                <div>
                  <h2
                    id={titleId}
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {t('bletchly_guide.title')}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsOpen(false)}
                aria-label={t('common.close', 'Kapat')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div ref={scrollRef} style={{ padding: '24px', overflowY: 'auto' }}>
              <div
                style={{
                  minHeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.5,
                    textAlign: 'center',
                    maxWidth: 720,
                  }}
                >
                  {t('bletchly_guide.intro')}
                </p>
              </div>
              <div ref={welcomeRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 90 }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 2 }}>...</span>
                <ArrowCardTravel
                  Svg={WelcomeSvg}
                  widthPct={60}
                  svgStyle={{ color: 'var(--color-primary)' }}
                  cardWidth={10}
                  speed={14}
                  spacing={200}
                  maxCards={25}
                  rerandomizeInterval={3000}
                />
                <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 2 }}>...</span>
              </div>

              <div ref={sectionsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {sections.map((sec, idx) => (
                  <InfoCard
                    key={idx}
                    onClick={() => (sec.onClick ? sec.onClick() : handleNavigate(sec.path))}
                    fullWidth={sec.fullWidth}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: sec.premium ? 'var(--color-warning)' : 'var(--color-surface)',
                        border: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {sec.icon}
                      </div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {sec.title}
                      </h3>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, flex: 1 }}>
                      {sec.desc}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, marginTop: 'auto' }}>
                      {sec.linkText}
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </div>
                  </InfoCard>
                ))}
              </div>
            </div>

            <style>{`
              @keyframes guideBounce {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                50% { transform: translateX(-50%) translateY(8px); }
              }
            `}</style>

            {showScrollBtn && (
              <button
                type="button"
                onClick={scrollToNext}
                aria-label={t('bletchly_guide.scroll_down', 'Aşağı kaydır')}
                style={{
                  position: 'absolute',
                  bottom: 18,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
                  zIndex: 10,
                  animation: 'guideBounce 2s ease-in-out infinite',
                }}
              >
                <ChevronDown size={36} strokeWidth={2.5} />
              </button>
            )}
          </section>
        </div>
      )}

      <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />
    </>
  )
}
