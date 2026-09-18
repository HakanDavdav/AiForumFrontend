import { useState } from 'react'
import {
  X,
  Sliders,
  Bot as BotIcon,
  Activity,
  ChevronDown,
  ChevronUp,
  Brain,
  Users,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import KingIcon from '../common/icons/KingIcon'
import AngryBotWithSwordsIcon from '../common/icons/AngryBotWithSwordsIcon'
import BotFlashCardsIcon from '../common/icons/BotFlashCardsIcon'
import CardContingencyIcon from '../common/icons/CardContingencyIcon'
import CardContingencyModifierIcon from '../common/icons/CardContingencyModifierIcon'
import ModalHeader from '../common/ModalHeader'
import { BotCapabilities, UserCapabilities } from '../../constants/enums'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function ProfileModifiersModal({ profile, isOpen, onClose }) {
  useDevLog('ProfileModifiersModal', arguments[0] || {})
  const { t } = useTranslation()
  const [activeBubble, setActiveBubble] = useState(null)

  if (!isOpen || !profile) return null

  const toggleBubble = (key) => {
    setActiveBubble((prev) => (prev === key ? null : key))
  }

  const isBot = profile.discriminator === 'Bot'
  const isTribe = profile.discriminator === 'Tribe' || !!profile.tribeId
  const isUser = !isBot && !isTribe

  // Map enum int or string (0 -> A, 1 -> B, 2 -> C, 3 -> D, 4 -> F)
  const rawGrade = isBot
    ? profile.botSettings?.botGrade
    : isTribe
    ? profile.tribeGrade
    : profile.userSettings?.userGrades
  const gradeMap = { 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'F', A: 'A', B: 'B', C: 'C', D: 'D', F: 'F' }
  const gradeLabel = gradeMap[rawGrade] || 'F'

  // Current Points
  const currentPoints = isTribe
    ? (profile.tribePoint ?? profile.tribeActorPoint ?? 0)
    : (profile.actorPoint ?? 0)

  // DynamicSettings Grade step bonus (stepValue = 2)
  const gradeBonusMap = { A: 8, B: 6, C: 4, D: 2, F: 0 }
  const stepBonus = gradeBonusMap[gradeLabel] || 0

  // Contingency modifier (%20 for A, %15 for B...)
  const contingencyModifierMap = { A: 20, B: 15, C: 10, D: 5, F: 0 }
  const gradeContingencyMod = contingencyModifierMap[gradeLabel] || 0

  const botCapabilities = profile.botSettings?.botCapabilities ?? BotCapabilities.Default
  const hasBotMemory =
    (botCapabilities & BotCapabilities.ProlongedBotMemory) === BotCapabilities.ProlongedBotMemory

  const userCapabilities = profile.userSettings?.userCapabilities ?? UserCapabilities.Default
  const isPremiumUser = (userCapabilities & UserCapabilities.Premium) === UserCapabilities.Premium

  const gradeColors = {
    A: '#22C55E',
    B: '#84CC16',
    C: '#F59E0B',
    D: '#F97316',
    F: '#EF4444',
  }
  const gradeColor = gradeColors[gradeLabel] || '#EF4444'

  // Grade checkpoint points from appsettings
  const checkpoints = isBot
    ? [
        { grade: 'F', points: 0 },
        { grade: 'D', points: 2000 },
        { grade: 'C', points: 3000 },
        { grade: 'B', points: 4000 },
        { grade: 'A', points: 5000 },
      ]
    : profile.discriminator === 'Tribe'
    ? [
        { grade: 'F', points: 0 },
        { grade: 'D', points: 20000 },
        { grade: 'C', points: 30000 },
        { grade: 'B', points: 40000 },
        { grade: 'A', points: 50000 },
      ]
    : [
        { grade: 'F', points: 0 },
        { grade: 'D', points: 200000 },
        { grade: 'C', points: 300000 },
        { grade: 'B', points: 400000 },
        { grade: 'A', points: 500000 },
      ]

  const renderGradeCheckpoints = () => {
    return (
      <div
        style={{
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
          {checkpoints.map((cp) => {
            const isCurrent = gradeLabel === cp.grade
            const isPassed = currentPoints >= cp.points && cp.points > 0
            const cpColor = gradeColors[cp.grade]

            return (
              <div
                key={cp.grade}
                style={{
                  padding: '6px 4px',
                  borderRadius: 8,
                  background: isCurrent
                    ? 'color-mix(in srgb, var(--color-primary) 14%, var(--color-surface))'
                    : 'color-mix(in srgb, var(--color-surface) 60%, transparent)',
                  border: isCurrent
                    ? `1.5px solid ${cpColor}`
                    : '1px solid var(--color-border)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: cpColor,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCurrent ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {cp.grade}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isCurrent ? cpColor : isPassed ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cp.points === 0 ? '0' : cp.points.toLocaleString('tr-TR')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render a modifier detail breakdown bubble
  const renderModifierBubble = ({ topContent, baseValue, modifiers = [], totalValue }) => (
    <div
      style={{
        marginTop: 6,
        padding: '12px 14px',
        borderRadius: 12,
        background: 'color-mix(in srgb, var(--color-primary) 6%, var(--color-surface))',
        border: '1px solid color-mix(in srgb, var(--color-primary) 28%, transparent)',
        fontSize: 12,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {topContent}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Base value - Sadece 'Base:' ve sağında sayı */}
        {baseValue !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: 600 }}>Base:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{baseValue}</span>
          </div>
        )}

        {/* Modifiers */}
        {modifiers.map((mod, idx) => {
          const clean = String(mod.value ?? '').replace(/[+%]/g, '').trim()
          const isZero = clean === '0' || clean === '0.0' || clean === '0 Adım'
          // +0 ve +%0 değerleri için temanın ana rengi (var(--color-primary)) kullanılsın, ton farkı oluşmasın
          const valColor = isZero ? 'var(--color-primary)' : (mod.color || 'var(--color-primary)')

          return (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span style={{ fontWeight: 600 }}>{mod.label}:</span>
              <span style={{ fontWeight: 700, color: valColor }}>{mod.value}</span>
            </div>
          )
        })}

        <div style={{ height: 1, background: 'var(--color-border)', margin: '3px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          <span style={{ fontWeight: 700 }}>Total:</span>
          <span style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 800 }}>{totalValue}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 540,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px',
          borderRadius: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Modal Header */}
        <ModalHeader
          icon={<Sliders size={28} color="var(--color-primary)" />}
          title={t('profile.modifiers', 'Modifiers')}
          subtitle={isTribe ? 'Klan' : isBot ? 'Bot' : 'Kullanıcı'}
          onClose={onClose}
          style={{ padding: '0 0 14px 0', marginBottom: 20 }}
        />

        {/* Scrollable Content - Unified list without intermediate category headers */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Grade & Premium / Memory Pair (Birbirine yakınlaştırılmış ayrı bloklar) */}
          <div style={{ order: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* 1. Grade Card */}
            <div>
              <div
                onClick={() => toggleBubble('gradeCard')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: activeBubble === 'gradeCard' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: gradeColor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 17,
                      fontWeight: 900,
                      lineHeight: 1,
                      border: '2px solid var(--color-surface)',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                      flexShrink: 0,
                    }}
                  >
                    {gradeLabel}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Grade {gradeLabel}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                      {t('profile.points', 'Puan')}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {currentPoints.toLocaleString('tr-TR')}
                    </div>
                  </div>
                  {activeBubble === 'gradeCard' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>

              {activeBubble === 'gradeCard' &&
                renderModifierBubble({
                  topContent: renderGradeCheckpoints(),
                  baseValue: '0',
                  modifiers: [
                    { label: 'Slot/Kart', value: `+${stepBonus}`, color: gradeColor },
                    ...(!isTribe ? [{ label: 'Münazara', value: `+${stepBonus}`, color: 'var(--color-primary)' }] : []),
                    { label: 'Miras', value: `+%${stepBonus}`, color: 'var(--color-primary)' },
                    ...(isBot || isTribe ? [{ label: 'Miras Çarpanı', value: `+%${gradeContingencyMod}`, color: '#f59e0b' }] : []),
                  ],
                  totalValue: `+${stepBonus}`,
                })}
            </div>

            {/* 2. Premium Section (for User) */}
            {isUser && (
              <div>
                <div
                  onClick={() => toggleBubble('premiumPerk')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--color-surface)',
                    border: activeBubble === 'premiumPerk' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isPremiumUser ? <KingIcon size={20} /> : <ShieldCheck size={20} />}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {isPremiumUser ? t('premium.title', 'Premium') : 'Default'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {activeBubble === 'premiumPerk' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                  </div>
                </div>

                {activeBubble === 'premiumPerk' &&
                  renderModifierBubble({
                    baseValue: '0',
                    modifiers: [
                      { label: 'Bot Kotası', value: isPremiumUser ? '+4' : '+0', color: 'var(--color-primary)' },
                      { label: 'Kart Alanı', value: isPremiumUser ? '+4' : '+0', color: 'var(--color-primary)' },
                      { label: 'Münazara', value: isPremiumUser ? '+4' : '+0', color: 'var(--color-primary)' },
                      { label: 'Miras Şansı', value: isPremiumUser ? '+%4' : '+%0', color: 'var(--color-primary)' },
                    ],
                    totalValue: isPremiumUser ? '+4' : '+0',
                  })}
              </div>
            )}

            {/* Gelişmiş Hafıza Section (for Bot) */}
            {isBot && (
              <div>
                <div
                  onClick={() => toggleBubble('botMemory')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--color-surface)',
                    border: activeBubble === 'botMemory'
                      ? (hasBotMemory ? '1.5px solid var(--color-warning)' : '1.5px solid var(--color-primary)')
                      : '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: hasBotMemory
                          ? 'color-mix(in srgb, var(--color-warning) 15%, transparent)'
                          : 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                        border: hasBotMemory
                          ? '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)'
                          : '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
                        color: hasBotMemory ? 'var(--color-warning)' : 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: hasBotMemory
                          ? '0 2px 10px color-mix(in srgb, var(--color-warning) 25%, transparent)'
                          : 'none',
                        flexShrink: 0,
                      }}
                    >
                      <Brain size={20} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {hasBotMemory ? t('bot.capability_extended_memory', 'Genişletilmiş Hafıza') : t('bot.capability_memory', 'Hafıza')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: hasBotMemory ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                      {hasBotMemory ? '2x' : '1x'}
                    </div>
                    {activeBubble === 'botMemory' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                  </div>
                </div>

                {activeBubble === 'botMemory' &&
                  renderModifierBubble({
                    title: 'Hafıza Süresi',
                    baseValue: '30 Gün',
                    modifiers: [
                      {
                        label: hasBotMemory ? t('bot.capability_extended_memory', 'Genişletilmiş Hafıza') : t('bot.capability_memory', 'Hafıza'),
                        value: hasBotMemory ? '2x' : '1x (Default)',
                        color: hasBotMemory ? 'var(--color-warning)' : 'var(--color-primary)',
                      },
                    ],
                    totalValue: hasBotMemory ? '60 Gün' : '30 Gün',
                  })}
              </div>
            )}
          </div>

          {/* Horizontal Divider Line below Grade & Premium */}
          <div
            style={{
              order: 2,
              width: '100%',
              height: 0,
              borderTop: '1px solid var(--color-border)',
              margin: '4px 0',
            }}
          />

          {/* 3. Bot Sahiplik Limiti (User & Bot) */}
          {((isUser && profile.userSettings) || (isBot && profile.botSettings)) && (
            <div style={{ order: 3 }}>
              <div
                onClick={() => toggleBubble('actorBots')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: activeBubble === 'actorBots' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BotIcon size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t('profile.bot_ownership_limit', 'Bot Sahiplik Limiti')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {isBot
                        ? t('profile.bot_creation_limit_desc', 'Maksimum sahip olunabilir alt bot sayısı')
                        : t('profile.bot_ownership_limit_desc', 'Maksimum sahip olunabilir bot sayısı')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {profile.botsCount ?? (profile.bots?.length || 0)} /{' '}
                    {isBot
                      ? (profile.botSettings?.botCountLimit || (4 + stepBonus))
                      : (profile.userSettings?.botCountLimit || (4 + stepBonus + (isPremiumUser ? 4 : 0)))}
                  </div>
                  {activeBubble === 'actorBots' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>

              {activeBubble === 'actorBots' &&
                renderModifierBubble({
                  baseValue: '4',
                  modifiers: [
                    { label: `Grade ${gradeLabel}`, value: `+${stepBonus}`, color: gradeColor },
                    ...(isUser
                      ? [
                          {
                            label: 'Premium',
                            value: isPremiumUser ? '+4' : '+0',
                            color: isPremiumUser ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          },
                        ]
                      : []),
                  ],
                  totalValue: `${
                    isBot
                      ? (profile.botSettings?.botCountLimit || (4 + stepBonus))
                      : (profile.userSettings?.botCountLimit || (4 + stepBonus + (isPremiumUser ? 4 : 0)))
                  }`,
                })}
            </div>
          )}

          {/* 3.5 Klan Katılım Limiti (User & Bot) */}
          {((isUser && profile.userSettings) || (isBot && profile.botSettings)) && (
            <div style={{ order: 4 }}>
              <div
                onClick={() => toggleBubble('actorTribes')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: activeBubble === 'actorTribes' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Users size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t('profile.tribe_limit', 'Klan Limiti')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {t('profile.tribe_limit_desc', 'Dahil olunabilecek maksimum klan sayısı')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {profile.tribes?.length || 0} /{' '}
                    {isBot
                      ? (profile.botSettings?.tribeCountLimit || (3 + stepBonus))
                      : (profile.userSettings?.tribeCountLimit || (3 + stepBonus + (isPremiumUser ? 4 : 0)))}
                  </div>
                  {activeBubble === 'actorTribes' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>

              {activeBubble === 'actorTribes' &&
                renderModifierBubble({
                  baseValue: '3',
                  modifiers: [
                    { label: `Grade ${gradeLabel}`, value: `+${stepBonus}`, color: gradeColor },
                    ...(isUser
                      ? [
                          {
                            label: 'Premium',
                            value: isPremiumUser ? '+4' : '+0',
                            color: isPremiumUser ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          },
                        ]
                      : []),
                  ],
                  totalValue: `${
                    isBot
                      ? (profile.botSettings?.tribeCountLimit || (3 + stepBonus))
                      : (profile.userSettings?.tribeCountLimit || (3 + stepBonus + (isPremiumUser ? 4 : 0)))
                  }`,
                })}
            </div>
          )}

          {/* 4. Kart Sahiplik Limiti (User & Bot) */}
          {((isUser && profile.userSettings) || (isBot && profile.botSettings)) && (
            <div style={{ order: 8 }}>
              <div
                onClick={() => toggleBubble('userCards')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: activeBubble === 'userCards' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BotFlashCardsIcon size={22} color="var(--color-primary)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t('profile.card_ownership_limit', 'Kart Sahiplik Limiti')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {t('profile.card_ownership_limit_desc', 'Envanterde tutulabilecek maksimum kişilik kartı')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {profile.ownedCards?.length || 0} /{' '}
                    {isBot
                      ? (profile.botSettings?.cardOwnershipLimit || (10 + stepBonus))
                      : (profile.userSettings?.cardOwnershipLimit || (10 + stepBonus + (isPremiumUser ? 4 : 0)))}
                  </div>
                  {activeBubble === 'userCards' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>

              {activeBubble === 'userCards' &&
                renderModifierBubble({
                  baseValue: '10',
                  modifiers: [
                    { label: `Grade ${gradeLabel}`, value: `+${stepBonus}`, color: gradeColor },
                    ...(isUser
                      ? [
                          {
                            label: 'Premium',
                            value: isPremiumUser ? '+4' : '+0',
                            color: isPremiumUser ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          },
                        ]
                      : []),
                  ],
                  totalValue: `${
                    isBot
                      ? (profile.botSettings?.cardOwnershipLimit || (10 + stepBonus))
                      : (profile.userSettings?.cardOwnershipLimit || (10 + stepBonus + (isPremiumUser ? 4 : 0)))
                  }`,
                })}
            </div>
          )}

          {/* 5. Kart Atanma Limiti (Bot & Tribe) */}
          {(isBot || isTribe) && (isBot ? profile.botSettings : true) && (
            <div style={{ order: 9 }}>
              <div
                onClick={() => toggleBubble('botAssignment')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: activeBubble === 'botAssignment' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BotFlashCardsIcon size={22} color="var(--color-primary)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t('profile.bot_assignment_limit', 'Kart Atanma Limiti')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {isTribe
                        ? t('profile.tribe_assignment_limit_desc', 'Klanın aktif kuşanabileceği kişilik kartı slotu')
                        : t('profile.bot_assignment_limit_desc', 'Botun aktif kuşanabileceği kişilik kartı slotu')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {isTribe
                      ? `${profile.personalityCards?.length || 0} / ${profile.tribeAssignmentLimit || (4 + stepBonus)}`
                      : `${profile.assignedCards?.length || 0} / ${profile.botSettings?.botAssignmentLimit || (4 + stepBonus)}`}
                  </div>
                  {activeBubble === 'botAssignment' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>

              {activeBubble === 'botAssignment' &&
                renderModifierBubble({
                  baseValue: '4',
                  modifiers: [
                    { label: `Grade ${gradeLabel}`, value: `+${stepBonus}`, color: gradeColor },
                  ],
                  totalValue: `${isTribe ? (profile.tribeAssignmentLimit || (4 + stepBonus)) : (profile.botSettings?.botAssignmentLimit || (4 + stepBonus))}`,
                })}
            </div>
          )}

          {/* 5.5 Kart Atama Kilidi Limiti (User & Bot) — owner eksenli assignment lock kotası */}
          {((isUser && profile.userSettings) || (isBot && profile.botSettings)) && (
            <div style={{ order: 12 }}>
              <div
                onClick={() => toggleBubble('assignmentLock')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: activeBubble === 'assignmentLock' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Lock size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t('profile.card_assignment_lock_limit', 'Kart Kilitleme Limiti')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {t('profile.card_assignment_lock_limit_desc', 'Sahip olunan atamalarda kilitlenebilecek maksimum kişilik kartı')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {profile.lockedAssignmentCount ?? 0} /{' '}
                    {isBot
                      ? (profile.botSettings?.cardAssignmentLockLimit || (2 + stepBonus))
                      : (profile.userSettings?.cardAssignmentLockLimit || (2 + stepBonus + (isPremiumUser ? 4 : 0)))}
                  </div>
                  {activeBubble === 'assignmentLock' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>

              {activeBubble === 'assignmentLock' &&
                renderModifierBubble({
                  baseValue: '2',
                  modifiers: [
                    { label: `Grade ${gradeLabel}`, value: `+${stepBonus}`, color: gradeColor },
                    ...(isUser
                      ? [
                          {
                            label: 'Premium',
                            value: isPremiumUser ? '+4' : '+0',
                            color: isPremiumUser ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          },
                        ]
                      : []),
                  ],
                  totalValue: `${
                    isBot
                      ? (profile.botSettings?.cardAssignmentLockLimit || (2 + stepBonus))
                      : (profile.userSettings?.cardAssignmentLockLimit || (2 + stepBonus + (isPremiumUser ? 4 : 0)))
                  }`,
                })}
            </div>
          )}

          {/* 6. Münazara / Tartışma Limiti */}
          {!isTribe && (
            <div style={{ order: 5 }}>
              <div
                onClick={() => toggleBubble('debateLimit')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: activeBubble === 'debateLimit' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AngryBotWithSwordsIcon size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t('profile.daily_debate_limit', 'Günlük Tartışma Limiti')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {t('profile.daily_debate_limit_desc', 'Eşzamanlı aktif münazara ve tartışma hakkı')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {isBot ? profile.botSettings?.debateLimit || 1 : profile.userSettings?.debateLimit || 3}
                  </div>
                  {activeBubble === 'debateLimit' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>

              {activeBubble === 'debateLimit' &&
                renderModifierBubble({
                  baseValue: '1',
                  modifiers: [
                    { label: `Grade ${gradeLabel}`, value: `+${stepBonus}`, color: gradeColor },
                    ...(isUser
                      ? [
                          {
                            label: 'Premium',
                            value: isPremiumUser ? '+4' : '+0',
                            color: isPremiumUser ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          },
                        ]
                      : []),
                  ],
                  totalValue: `${isBot ? profile.botSettings?.debateLimit || (1 + stepBonus) : profile.userSettings?.debateLimit || (1 + stepBonus + (isPremiumUser ? 4 : 0))}`,
                })}
            </div>
          )}

          {/* 7. Kart Miras Şansı */}
          <div style={{ order: 10 }}>
            <div
              onClick={() => toggleBubble('cardInheritance')}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--color-surface)',
                border: activeBubble === 'cardInheritance' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CardContingencyIcon size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {t('profile.card_inheritance_chance', 'Kart Miras Şansı')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {t('profile.card_inheritance_chance_desc', 'Kişilik kartı kalıtım ve miras alma olasılığı')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  %{Math.round(((isTribe ? profile.cardInheritanceChance : (isUser ? profile.userSettings : profile.botSettings)?.cardInheritanceChance) ?? (0.25 + (isBot || isTribe ? stepBonus * 0.01 : (isPremiumUser ? 0.04 : 0)))) * 100)}
                </div>
                {activeBubble === 'cardInheritance' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
              </div>
            </div>

            {activeBubble === 'cardInheritance' &&
              renderModifierBubble({
                baseValue: '%25',
                modifiers: [
                  ...(isBot || isTribe
                    ? [{ label: `Grade ${gradeLabel}`, value: `+%${stepBonus}`, color: gradeColor }]
                    : [
                        {
                          label: 'Premium',
                          value: isPremiumUser ? '+%4' : '+%0',
                          color: isPremiumUser ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        },
                      ]),
                ],
                totalValue: `%${Math.round(((isTribe ? profile.cardInheritanceChance : (isUser ? profile.userSettings : profile.botSettings)?.cardInheritanceChance) ?? (0.25 + (isBot || isTribe ? stepBonus * 0.01 : (isPremiumUser ? 0.04 : 0)))) * 100)}`,
              })}
          </div>

          {/* 9. Bot / Tribe: Derece Miras Çarpanı */}
          {(isBot ? profile.botSettings?.cardInheritanceModifier !== undefined && profile.botSettings?.cardInheritanceModifier !== null : isTribe && profile.cardInheritanceModifier !== undefined && profile.cardInheritanceModifier !== null) && (
            <div style={{ order: 11 }}>
              <div
                onClick={() => toggleBubble('cardModifier')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: activeBubble === 'cardModifier' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CardContingencyModifierIcon size={34} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t('profile.card_inheritance_modifier', 'Kart Miras Çarpanı')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {t('profile.card_inheritance_modifier_desc', 'Dereceye bağlı ek kişilik kartı miras çarpanı')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    +%{Math.round(((isTribe ? profile.cardInheritanceModifier : profile.botSettings?.cardInheritanceModifier) || 0) * 100)}
                  </div>
                  {activeBubble === 'cardModifier' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>

              {activeBubble === 'cardModifier' &&
                renderModifierBubble({
                  baseValue: '%0',
                  modifiers: [
                    { label: `Grade ${gradeLabel}`, value: `+%${gradeContingencyMod}`, color: '#10b981' },
                  ],
                  totalValue: `+%${Math.round(((isTribe ? profile.cardInheritanceModifier : profile.botSettings?.cardInheritanceModifier) || 0) * 100)}`,
                })}
            </div>
          )}

          {/* 9. Bot: Günlük Operasyon Sayısı (En Altta) */}
          {isBot && profile.botSettings?.dailyBotOperationCount !== undefined && (
            <div
              style={{
                order: 6,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Activity size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {t('profile.daily_bot_operations', 'Günlük Bot Operasyonu')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {t('profile.daily_bot_operations_desc', 'Botun gerçekleştirdiği günlük aktivite sayısı')}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {profile.botSettings.dailyBotOperationCount}
              </div>
            </div>
          )}

          {/* 10. Tribe: Üye Kapasitesi */}
          {isTribe && (
            <div style={{ order: 7 }}>
              <div
                onClick={() => toggleBubble('tribeMembers')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: activeBubble === 'tribeMembers' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Users size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t('tribe.member_capacity', 'Üye Kapasitesi')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {t('tribe.member_capacity_desc', 'Klanın alabileceği maksimum üye sayısı')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {profile.memberCount ?? 0} / 50
                  </div>
                  {activeBubble === 'tribeMembers' ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>

              {activeBubble === 'tribeMembers' &&
                renderModifierBubble({
                  baseValue: '50',
                  modifiers: [],
                  totalValue: '50',
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
