import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Users } from 'lucide-react'
import CardActorListModal from './CardActorListModal'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'

export default function PersonalityCard({ card, compact, onClick }) {
  const { t } = useTranslation()
  const [modalType, setModalType] = useState(null)

  const cardName =
    card?.cardName ||
    card?.card?.cardName ||
    card?.ownership?.cardName ||
    card?.ownership?.originalCard?.cardName ||
    t('card.card', 'Kart')
  const hint =
    card?.cardHint ||
    card?.personalityPrompt ||
    card?.card?.cardHint ||
    card?.card?.personalityPrompt ||
    card?.ownership?.originalCard?.cardHint ||
    card?.ownership?.originalCard?.personalityPrompt ||
    ''
  const rawTags = card?.cardTags || card?.tags || card?.card?.cardTags || card?.card?.tags || card?.originalCard?.cardTags || card?.originalCard?.tags || ''
  const tags = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string' && rawTags.trim()
      ? rawTags.split(',').map(s => s.trim()).filter(Boolean)
      : []
  const filled = !!card?.cardName || !!card?.card?.cardName || !!card?.ownership || !!card?.personalityCardId || !!card?.cardId

  const ownershipCount = card?.ownershipCount ?? card?.card?.ownershipCount ?? card?.ownership?.ownershipCount ?? card?.ownership?.originalCard?.ownershipCount ?? 0
  const assignmentCount = card?.assignmentCount ?? card?.card?.assignmentCount ?? card?.ownership?.assignmentCount ?? card?.ownership?.originalCard?.assignmentCount ?? 0
  const personalityCardId = card?.personalityCardId ?? card?.card?.personalityCardId ?? card?.ownership?.originalCard?.personalityCardId ?? card?.cardId ?? null

  const assignedBots = card?.assignedBots || []
  const assignedTribes = card?.assignedTribes || []

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: compact ? 'auto' : 120,
        gap: 6,
        padding: compact ? '10px 8px' : '12px 16px',
        borderRadius: 10,
        border: `1.5px solid ${filled ? '#22c55e' : 'var(--color-border)'}`,
        background: filled ? 'rgba(34, 197, 94, 0.08)' : 'var(--color-surface)',
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <span style={{
        fontSize: compact ? 11 : 14,
        fontWeight: 700,
        color: filled ? '#16a34a' : 'var(--color-text-faint)',
        textAlign: 'center',
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%'
      }}>
        {cardName}
      </span>

      {!compact && hint && (
        <p style={{
          margin: 0,
          fontSize: 12.5,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1
        }}>
          {hint}
        </p>
      )}

      {!compact && tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {tags.map(tag => (
            <span
              key={typeof tag === 'string' ? tag : tag?.cardTagId}
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 12,
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              {typeof tag === 'string' ? tag : tag?.tagName || tag?.name}
            </span>
          ))}
        </div>
      )}

      {!hint && !tags.length && (
        <span style={{ fontSize: 12, color: 'var(--color-text-faint)', textAlign: 'center' }}>
          —/{t('card.card', 'Kart')}
        </span>
      )}

      {filled && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 'auto' }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (personalityCardId) setModalType('owners') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: compact ? 10.5 : 11.5, color: 'var(--color-text-secondary)',
              background: 'transparent', border: 'none', cursor: personalityCardId ? 'pointer' : 'default',
              padding: '2px 4px', borderRadius: 6
            }}
            title={t('card.owners', 'Sahipler')}
          >
            <Users size={compact ? 11 : 12} />
            {ownershipCount}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (personalityCardId) setModalType('assignees') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: compact ? 10.5 : 11.5, color: 'var(--color-text-secondary)',
              background: 'transparent', border: 'none', cursor: personalityCardId ? 'pointer' : 'default',
              padding: '2px 4px', borderRadius: 6
            }}
            title={t('card.assignees', 'Atanmış Botlar')}
          >
            <Bot size={compact ? 11 : 12} />
            {assignmentCount}
          </button>
        </div>
      )}

      {(assignedBots.length > 0 || assignedTribes.length > 0) && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--color-border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            {t('card.yours', 'Yours:')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {assignedBots.map(b => (
              <ActorMinimalCard key={b.actorId} actor={b} />
            ))}
            {assignedTribes.map(tr => (
              <TribeMinimalCard key={tr.tribeId} {...tr} />
            ))}
          </div>
        </div>
      )}

      <CardActorListModal
        cardId={personalityCardId}
        type={modalType}
        isOpen={!!modalType && !!personalityCardId}
        onClose={() => setModalType(null)}
      />
    </div>
  )
}