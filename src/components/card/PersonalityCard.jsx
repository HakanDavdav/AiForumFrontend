import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Check, Pencil, Users } from 'lucide-react'
import CardActorListModal from './CardActorListModal'
import CardDetailModal from './CardDetailModal'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import SelectionMarker from '../common/SelectionMarker'

export default function PersonalityCard({
  card,
  slotNumber,
  onClick,
  disabled = false,
  selectable = false,
  selected = false,
  onSelect,
  showMark = true,
  locked = false,
  maxSelections,
  selectedCount = 0,
  variant = 'default',
  editorCardName = '',
  editorPrompt = '',
  editorConfirmed = false,
  showValidation = false,
  onEditorChange,
  onEditorConfirm,
  onEditorEdit,
}) {
  const { t } = useTranslation()
  const [modalType, setModalType] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  if (variant === 'editor') {
    const canConfirm = editorCardName.trim() !== '' && editorPrompt.trim() !== ''

    return (
      <div
        className={`personality-card personality-card--filled personality-card--editor${editorConfirmed ? ' personality-card--editor-confirmed' : ''}`}
      >
        <div className="personality-card__topline">
          {editorConfirmed && (
            <span className="personality-card__title personality-card-editor__confirmed-title">
              {editorCardName}
            </span>
          )}
          <SelectionMarker
            checked={editorConfirmed}
            onChange={editorConfirmed ? () => onEditorEdit?.() : undefined}
            disabled={disabled}
            size="sm"
            label={
              editorConfirmed
                ? t('card.personality_confirmed', 'Kişilik kartı onaylandı')
                : t('card.personality_pending', 'Kişilik kartı bekliyor')
            }
          />
        </div>

        <div className="personality-card-editor__body">
          {!editorConfirmed && (
            <input
              className={`input personality-card__title personality-card-editor__name${showValidation && !editorCardName.trim() ? ' error' : ''}`}
              type="text"
              value={editorCardName}
              onChange={(event) => onEditorChange('cardName', event.target.value)}
              placeholder={t('card.card_name_placeholder', 'Kişilik kart adı')}
              disabled={disabled}
              maxLength={100}
              aria-label={t('card.card_name', 'Kart adı')}
            />
          )}

          {editorConfirmed ? (
            <p className="personality-card-editor__preview">{editorPrompt}</p>
          ) : (
            <textarea
              className={`input textarea personality-card-editor__prompt${showValidation && !editorPrompt.trim() ? ' error' : ''}`}
              value={editorPrompt}
              onChange={(event) => onEditorChange('prompt', event.target.value)}
              placeholder={t('card.personality_prompt_placeholder', 'Bu kişiliği tanımlayın...')}
              disabled={disabled}
              maxLength={2000}
              aria-label={t('card.personality_prompt', 'Kişilik tanımı')}
            />
          )}
        </div>

        {editorConfirmed && (
          <div className="personality-card__stats personality-card-editor__confirmed-stats">
            <span className="personality-card__stat" title={t('card.owners', 'Sahipler')}>
              <Users size={12} />0
            </span>
            <span className="personality-card__stat" title={t('card.assignees', 'Atanmış Botlar')}>
              <Bot size={12} />0
            </span>
          </div>
        )}

        <div className="personality-card-editor__footer personality-card__stats">
          {editorConfirmed ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm personality-card-editor__edit"
              onClick={onEditorEdit}
              disabled={disabled}
            >
              <Pencil size={13} /> {t('action.edit', 'Düzenle')}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm personality-card-editor__confirm"
              onClick={onEditorConfirm}
              disabled={disabled || !canConfirm}
            >
              <Check size={14} /> {t('card.confirm_personality', 'Kişilik kartını onayla')}
            </button>
          )}
        </div>
      </div>
    )
  }

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
  const rawTags =
    card?.cardTags ||
    card?.tags ||
    card?.card?.cardTags ||
    card?.card?.tags ||
    card?.originalCard?.cardTags ||
    card?.originalCard?.tags ||
    ''
  const tags = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string' && rawTags.trim()
      ? rawTags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  const filled =
    !!card?.cardName ||
    !!card?.card?.cardName ||
    !!card?.ownership ||
    !!card?.personalityCardId ||
    !!card?.cardId

  const ownershipCount =
    card?.ownershipCount ??
    card?.card?.ownershipCount ??
    card?.ownership?.ownershipCount ??
    card?.ownership?.originalCard?.ownershipCount ??
    0
  const assignmentCount =
    card?.assignmentCount ??
    card?.card?.assignmentCount ??
    card?.ownership?.assignmentCount ??
    card?.ownership?.originalCard?.assignmentCount ??
    0
  const personalityCardId =
    card?.personalityCardId ??
    card?.card?.personalityCardId ??
    card?.ownership?.originalCard?.personalityCardId ??
    card?.cardId ??
    null

  const assignedBots = card?.assignedBots || []
  const assignedTribes = card?.assignedTribes || []
  const isSelectionDisabled =
    disabled ||
    locked ||
    (selectable && !selected && maxSelections != null && selectedCount >= maxSelections)

  const handleCardClick = () => {
    if (locked) return

    if (selectable) {
      if (!isSelectionDisabled) onSelect?.()
      return
    }

    onClick?.()
    if (filled) setIsDetailOpen(true)
  }

  const handleCardKeyDown = (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && filled) {
      event.preventDefault()
      if (locked) return
      if (selectable) {
        if (!isSelectionDisabled) onSelect?.()
      } else {
        setIsDetailOpen(true)
      }
    }
  }

  return (
    <div
      className={`personality-card ${filled ? 'personality-card--filled' : 'personality-card--empty'}${selectable ? ' personality-card--selectable' : ''}${selected ? ' personality-card--selected' : ''}${isSelectionDisabled ? ' personality-card--selection-disabled' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={filled ? 'button' : undefined}
      tabIndex={filled ? 0 : undefined}
    >
      <div className="personality-card__topline">
        <span className="personality-card__eyebrow">
          {slotNumber ? String(slotNumber) : t('card.persona', 'Persona')}
        </span>
        <span className="personality-card__title">
          {cardName.length > 40 ? cardName.substring(0, 40) + '...' : cardName}
        </span>
        {showMark ? (
          <span className="personality-card__mark">
            <SelectionMarker
              checked={selectable ? selected : filled}
              size="sm"
              locked={locked}
              label={
                selectable
                  ? selected
                    ? t('card.selected', 'Seçili kart')
                    : t('card.select', 'Kartı seç')
                  : filled
                    ? t('card.selected', 'Seçili kart')
                    : t('card.empty', 'Boş kart yuvası')
              }
            />
          </span>
        ) : (
          <span
            className="personality-card__mark personality-card__mark--placeholder"
            aria-hidden="true"
          />
        )}
      </div>

      {hint && <p className="personality-card__hint">{hint}</p>}

      {tags.length > 0 && (
        <div className="personality-card__tags">
          {tags.map((tag) => (
            <span
              key={typeof tag === 'string' ? tag : tag?.cardTagId}
              className="personality-card__tag"
            >
              {typeof tag === 'string' ? tag : tag?.tagName || tag?.name}
            </span>
          ))}
        </div>
      )}

      {!hint && !tags.length && (
        <span className="personality-card__empty-copy">—/{t('card.card', 'Kart')}</span>
      )}

      {(assignedBots.length > 0 || assignedTribes.length > 0) && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--color-primary-light)',
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 8,
            }}
          >
            {t('card.yours', 'Assigned:')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, zoom: 0.75 }}>
            {assignedBots.map((b) => (
              <ActorMinimalCard
                key={b.actorId}
                actor={b}
                showHierarchyBtn={false}
                showMindBtn={false}
                showPoint={false}
                showEditBtn={false}
              />
            ))}
            {assignedTribes.map((tr) => (
              <TribeMinimalCard
                key={tr.tribeId}
                {...tr}
                variant="compact"
                showMindBtn={false}
                showEditBtn={false}
                showPoint={false}
              />
            ))}
          </div>
        </div>
      )}

      {filled && (
        <div
          className="personality-card__stats"
          style={{
            marginTop: assignedBots.length > 0 || assignedTribes.length > 0 ? -2 : 12,
            paddingTop: assignedBots.length > 0 || assignedTribes.length > 0 ? 0 : 12,
            borderTop:
              assignedBots.length > 0 || assignedTribes.length > 0
                ? 'none'
                : '1px solid var(--color-primary-light)',
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (personalityCardId) setModalType('owners')
            }}
            className="personality-card__stat"
            title={t('card.owners', 'Sahipler')}
          >
            <Users size={12} />
            {ownershipCount}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (personalityCardId) setModalType('assignees')
            }}
            className="personality-card__stat"
            title={t('card.assignees', 'Atanmış Botlar')}
          >
            <Bot size={12} />
            {assignmentCount}
          </button>
        </div>
      )}

      <CardActorListModal
        cardId={personalityCardId}
        type={modalType}
        isOpen={!!modalType && !!personalityCardId}
        onClose={() => setModalType(null)}
      />

      <CardDetailModal card={card} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
    </div>
  )
}
