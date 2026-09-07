import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { Swords, Check, X, ShieldAlert, User, Timer } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import { trackDebate } from '../../utils/analytics'

export default function InvitationModal({ invitation, onClose }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // 120-second TTL countdown
  const calculateInitialTime = () => {
    if (!invitation?.createdAt) return 120
    const elapsed = Math.floor((Date.now() - new Date(invitation.createdAt).getTime()) / 1000)
    return Math.max(0, 120 - (isNaN(elapsed) ? 0 : elapsed))
  }

  const [timeLeft, setTimeLeft] = useState(calculateInitialTime)

  useEffect(() => {
    if (!invitation) return

    setTimeLeft(calculateInitialTime())

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          toast.error(t('debate.invitation_expired', 'Münazara davetinin süresi doldu.'))
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [invitation, onClose, t])

  if (!invitation) return null

  const handleAccept = async () => {
    try {
      setLoading(true)
      await actorApi.acceptDebate(invitation.debateId)
      trackDebate('accept_challenge', { debate_id: invitation.debateId })
      toast.success(t('debate.invitation_accepted', 'Münazara kabul edildi! Arenaya aktarılıyorsunuz...'))
      onClose()
      navigate(`/debate?id=${invitation.debateId}`, {
        state: {
          proposition: invitation.proposition,
          proponent: {
            id: invitation.proponentId,
            name: invitation.proponentName,
            imageUrl: invitation.proponentImageUrl,
            discriminator: 'User',
          },
        },
      })
    } catch (err) {
      toast.error(err.response?.data?.message || t('debate.accept_error', 'Davet kabul edilemedi.'))
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    try {
      setLoading(true)
      await actorApi.declineDebate(invitation.debateId)
      toast(t('debate.invitation_declined', 'Münazara daveti reddedildi.'), { icon: '🚫' })
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || t('debate.decline_error', 'Davet reddedilemedi.'))
    } finally {
      setLoading(false)
    }
  }

  const progressPercentage = Math.max(0, Math.min(100, (timeLeft / 120) * 100))

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.25s ease-out',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.95) 0%, rgba(15, 18, 28, 0.98) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.2)',
          borderRadius: '20px',
          padding: '28px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '140px',
            height: '140px',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header with Swords Icon & 120s Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <Swords size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                {t('debate.incoming_challenge', 'Münazara Meydan Okuması!')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                {t('debate.challenge_subtitle', 'Bir kullanıcı seni canlı münazaraya davet etti.')}
              </p>
            </div>
          </div>

          {/* Countdown Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: timeLeft <= 20 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: timeLeft <= 20 ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
              color: timeLeft <= 20 ? '#ef4444' : '#e2e8f0',
              fontSize: '0.85rem',
              fontWeight: '700',
            }}
          >
            <Timer size={14} />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Progress Bar for 120s TTL */}
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            marginBottom: '20px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercentage}%`,
              height: '100%',
              background: timeLeft <= 20 ? '#ef4444' : 'linear-gradient(90deg, #ef4444, #f59e0b)',
              transition: 'width 1s linear',
            }}
          />
        </div>

        {/* Challenger Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '20px',
          }}
        >
          {invitation.proponentImageUrl ? (
            <img
              src={invitation.proponentImageUrl}
              alt={invitation.proponentName}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(239, 68, 68, 0.5)',
              }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(239, 68, 68, 0.5)',
              }}
            >
              <User size={24} color="#94a3b8" />
            </div>
          )}
          <div>
            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#f8fafc' }}>
              {invitation.proponentName || t('actor.anonymous', 'Kullanıcı')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '500' }}>
              {t('debate.role_proponent', 'Savunucu (Meydan Okuyan)')}
            </div>
          </div>
        </div>

        {/* Proposition Box */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            {t('debate.proposition', 'Tartışma Önermesi')}
          </label>
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderLeft: '4px solid #ef4444',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              color: '#e2e8f0',
              fontStyle: 'italic',
            }}
          >
            "{invitation.proposition}"
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleDecline}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <X size={16} />
            {t('common.decline', 'Reddet')}
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              fontWeight: '600',
              fontSize: '0.9rem',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Check size={16} />
            {loading ? t('common.loading', 'Yükleniyor...') : t('debate.accept_and_fight', 'Kabul Et & Arenaya Gir')}
          </button>
        </div>
      </div>
    </div>
  )
}
