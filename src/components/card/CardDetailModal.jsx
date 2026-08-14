import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, Bot, CalendarFold, Hash, Tag, Users, X, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import BotFlashCardsIcon from '../common/BotFlashCardsIcon'

function normalizeTags(rawTags) {
  if (Array.isArray(rawTags)) return rawTags
  if (typeof rawTags !== 'string' || !rawTags.trim()) return []
  return rawTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const datePart = date.toLocaleDateString('tr-TR')
  const timePart = date.toLocaleTimeString('tr-TR', { hour12: false })
  return `${datePart} / ${timePart}`
}

function DetailRow({ icon: Icon, label, value, multiline = false, iconSize = 14 }) {
  if (value === null || value === undefined || value === '') return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 0.35fr) minmax(0, 1fr)',
        gap: 16,
        padding: '12px 0',
        borderBottom: '1px solid var(--color-border-light)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 7,
          color: 'var(--color-text-secondary)',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {Icon && <Icon size={iconSize} style={{ flexShrink: 0, marginTop: 1 }} />}
        <span>{label}</span>
      </div>
      <div
        style={{
          minWidth: 0,
          color: 'var(--color-text-primary)',
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: multiline ? 'pre-wrap' : 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default function CardDetailModal({ card, isOpen, onClose }) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !card) return null

  const cardData = card.card || card.originalCard || card
  const cardName = cardData.cardName || card.cardName || t('card.card', 'Kart')
  const personalityPrompt = cardData.personalityPrompt ?? card.personalityPrompt
  const cardHint = cardData.cardHint ?? card.cardHint
  const tags = normalizeTags(cardData.cardTags ?? cardData.tags ?? card.tags)
  const cardId = cardData.personalityCardId ?? card.cardId
  const ownershipId = card.ownershipId
  const actorId = card.actorId
  const acquisitionType =
    card.acquisitionType === 0 ? 'Created' : card.acquisitionType === 1 ? 'Purchased' : null
  const assignedBots = card.assignedBots || cardData.assignedBots || []
  const assignedTribes = card.assignedTribes || cardData.assignedTribes || []
  const ownershipCount = cardData.ownershipCount ?? card.ownershipCount
  const assignmentCount = cardData.assignmentCount ?? card.assignmentCount

  const detailRows = [
    {
      icon: BotFlashCardsIcon,
      iconSize: 20,
      label: t('card.prompt', 'Kişilik Promptu'),
      value: personalityPrompt || (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-danger)' }} title={t('card.not_creator', 'Orijinal prompta erişmek için yaratıcısı olmalısınız.')}>
          <Crown size={16} /> 
          {t('card.hidden_prompt', 'Gizli (Yalnızca Yaratıcı)')}
        </span>
      ),
      multiline: true,
    },
    {
      icon: BotFlashCardsIcon,
      iconSize: 20,
      label: t('card.hint', 'Kart Hint'),
      value: cardHint,
      multiline: true,
    },
    {
      icon: BotFlashCardsIcon,
      iconSize: 20,
      label: t('card.tags', 'Etiketler'),
      value: tags.length > 0 ? tags.join(', ') : null,
    },
    {
      icon: BotFlashCardsIcon,
      iconSize: 20,
      label: t('card.marketplace_status', 'Marketplace'),
      value:
        cardData.isListedOnMarketplace === null || cardData.isListedOnMarketplace === undefined
          ? null
          : cardData.isListedOnMarketplace
            ? t('common.yes', 'Evet')
            : t('common.no', 'Hayır'),
    },
    {
      icon: BotFlashCardsIcon,
      iconSize: 20,
      label: t('card.price', 'Fiyat'),
      value: cardData.price == null ? null : `${cardData.price} AP`,
    },
    { icon: Users, label: t('card.ownership_count', 'Sahiplik Sayısı'), value: ownershipCount },
    { icon: Bot, label: t('card.assignment_count', 'Atama Sayısı'), value: assignmentCount },
    { icon: Hash, label: 'Card ID', value: cardId },
    { icon: Hash, label: 'Ownership ID', value: ownershipId },
    { icon: Hash, label: 'Actor ID', value: actorId },
    { icon: Hash, label: t('card.acquisition_type', 'Edinim Türü'), value: acquisitionType },
    {
      icon: CalendarFold,
      label: t('card.acquired_at', 'Edinilme'),
      value: formatDate(card.acquiredAt),
    },
    {
      icon: CalendarFold,
      label: t('card.created_at', 'Oluşturulma'),
      value: formatDate(cardData.createdAt),
    },
    {
      icon: CalendarFold,
      label: t('card.updated_at', 'Güncellenme'),
      value: formatDate(cardData.updatedAt),
    },
  ]

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 150 }} role="presentation">
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personality-card-detail-title"
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: 680, maxHeight: '88vh', padding: 0, overflow: 'hidden' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                color: 'var(--color-primary)',
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <BotFlashCardsIcon size={32} />
              {t('card.details', 'Kart Detayları')}
            </div>
            <h2
              id="personality-card-detail-title"
              style={{
                margin: 0,
                color: 'var(--color-text-primary)',
                fontSize: 22,
                lineHeight: 1.25,
                overflowWrap: 'anywhere',
              }}
            >
              {cardName}
            </h2>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label={t('common.close', 'Kapat')}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{ maxHeight: 'calc(88vh - 92px)', overflowY: 'auto', padding: '8px 24px 24px' }}
        >
          <div>
            {detailRows.map((row) => (
              <DetailRow key={row.label} {...row} />
            ))}
          </div>

          {(assignedBots.length > 0 || assignedTribes.length > 0) && (
            <div style={{ paddingTop: 20 }}>
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: '0 0 10px',
                  color: 'var(--color-text-primary)',
                  fontSize: 14,
                }}
              >
                <Bot size={16} />
                {t('card.assignments', 'Atamalar')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assignedBots.map((assignedBot) => (
                  <ActorMinimalCard
                    key={assignedBot.actorId}
                    actor={assignedBot}
                    showHierarchyBtn={false}
                    showMindBtn={false}
                    showEditBtn={false}
                    clickable={false}
                  />
                ))}
                {assignedTribes.map((assignedTribe) => (
                  <TribeMinimalCard
                    key={assignedTribe.tribeId}
                    {...assignedTribe}
                    showPoint={false}
                    showMindBtn={false}
                    showEditBtn={false}
                    clickable={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
