import { useEffect, useId, useState } from 'react'
import { ShieldQuestion, X, Bot, Users, Sparkles, Newspaper, ArrowRight, Podium } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import IconActionButton from './IconActionButton'
import BotFlashCardsIcon from './BotFlashCardsIcon'
import Logo from './Logo'

export default function BletchlyGuideModal({ triggerStyle }) {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()
  const navigate = useNavigate()
  const { t } = useTranslation()

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
    navigate(path)
  }

  const sections = [
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
    }
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
              width: 'min(700px, calc(100vw - 32px))',
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
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <p style={{ margin: '0 0 24px 0', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {t('bletchly_guide.intro')}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {sections.map((sec, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleNavigate(sec.path)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: 20,
                      borderRadius: 12,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      gap: 12
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: 'var(--color-surface)',
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
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
