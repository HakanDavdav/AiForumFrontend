import { useTranslation } from 'react-i18next'
import PersonalityCard from './PersonalityCard'

function getCardId(item) {
  return item?.cardId || item?.personalityCardId || item?.card?.personalityCardId || null
}

function getCard(item) {
  return item?.card || item
}

export default function CardSelectionSlots({
  cards = [],
  selectedCardIds = [],
  onToggle,
  maxSelections,
  disabled = false,
  showHeader = true,
  slotCount = 0,
  lockedCardIds = [],
}) {
  const { t } = useTranslation()
  const selectableCards = cards
    .map((item) => ({ id: getCardId(item), card: getCard(item) }))
    .filter((item) => item.id && item.card)
  const isLockedCard = (item) => lockedCardIds.includes(item.id)
  const selectedCount = selectableCards.filter((item) => selectedCardIds.includes(item.id)).length
  const totalSlotCount = Math.max(selectableCards.length, slotCount)

  if (selectableCards.length === 0) {
    return (
      <div className="card-selection-slots">
        <p className="text-muted" style={{ margin: slotCount > 0 ? '0 0 12px' : 0 }}>
          {t('card.no_owned_cards', 'Henüz sahip olduğunuz bir kişilik kartı yok.')}
        </p>
        {slotCount > 0 && (
          <div className="personality-card-slots" style={{ '--card-count': slotCount }}>
            {Array.from({ length: slotCount }, (_, index) => (
              <div
                key={index}
                className="personality-card-slot"
                style={{
                  '--slot-count': slotCount,
                  '--slot-index': index,
                  '--slot-rotation': `${slotCount === 1 ? 0 : ((index / (slotCount - 1)) * 2 - 1) * 8}deg`,
                  '--slot-z': slotCount - Math.abs(index - (slotCount - 1) / 2),
                }}
              >
                <PersonalityCard slotNumber={index + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card-selection-slots">
      {showHeader && (
        <div className="card-selection-slots__header">
          <span>{t('card.select_slots', 'Kart slotlarını seçin')}</span>
          <span className="card-selection-slots__count">
            {selectedCount}
            {maxSelections ? ` / ${maxSelections}` : ''}
          </span>
        </div>
      )}
      <div className="personality-card-slots" style={{ '--card-count': totalSlotCount }}>
        {selectableCards.map(({ id, card }, index) => {
          const locked = isLockedCard({ id })
          return (
            <div
              key={id}
              className="personality-card-slot"
              style={{
                '--slot-count': totalSlotCount,
                '--slot-index': index,
                '--slot-rotation': `${totalSlotCount === 1 ? 0 : ((index / (totalSlotCount - 1)) * 2 - 1) * 8}deg`,
                '--slot-z': totalSlotCount - Math.abs(index - (totalSlotCount - 1) / 2),
              }}
            >
              <PersonalityCard
                slotNumber={index + 1}
                card={card}
                selectable={!locked}
                selected={selectedCardIds.includes(id)}
                locked={locked}
                disabled={disabled}
                onSelect={() => onToggle(id)}
                maxSelections={maxSelections}
                selectedCount={selectedCount}
              />
            </div>
          )
        })}
        {Array.from({ length: totalSlotCount - selectableCards.length }, (_, emptyIndex) => {
          const index = selectableCards.length + emptyIndex

          return (
            <div
              key={`empty-${index}`}
              className="personality-card-slot"
              style={{
                '--slot-count': totalSlotCount,
                '--slot-index': index,
                '--slot-rotation': `${totalSlotCount === 1 ? 0 : ((index / (totalSlotCount - 1)) * 2 - 1) * 8}deg`,
                '--slot-z': totalSlotCount - Math.abs(index - (totalSlotCount - 1) / 2),
              }}
            >
              <PersonalityCard slotNumber={index + 1} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
