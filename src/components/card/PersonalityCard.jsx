import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bot, Check, Info, Edit2, Users, Crown, Pencil, Lock, LockOpen, Network } from 'lucide-react'
import CardActorListModal from './CardActorListModal'
import CardDetailModal from './CardDetailModal'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ActorAvatar from '../actor/ActorAvatar'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import SelectionMarker from '../common/SelectionMarker'
import IconActionButton from '../common/IconActionButton'
import BotIcon from '../common/icons/BotIcon'

export default function PersonalityCard({
  card,
  actor,
  slotNumber,
  onClick,
  disabled = false,
  selectable = false,
  selected = false,
  onSelect,
  showMark = true,
  locked = false,
  tribeAssigned = false,
  tribeBadgeLabel = null,
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
  onEditClick = null,
  lockable = false,
  assignLocked = false,
  onToggleLock,
  selectionReadOnly = false,
  editorLocked = false,
  onToggleEditorLock,
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [modalType, setModalType] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  if (variant === 'distribute') {
    const actorData = actor || card?.actor || card?.winnerActor || {}
    const actorName =
      actorData.name || actorData.profileName || card?.cardName || t('card.card', 'Kart')

    return (
      <div
        className="personality-card personality-card--filled personality-card--distribute"
        style={{
          width: '88px',
          minWidth: '88px',
          maxWidth: '88px',
          height: '120px',
          minHeight: 'unset',
          maxHeight: 'unset',
          padding: '10px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          background:
            'linear-gradient(145deg, var(--color-surface), color-mix(in srgb, var(--color-primary) 15%, var(--color-surface)))',
          border: '1.5px solid var(--color-primary)',
          borderRadius: 12,
          boxShadow:
            '0 0 20px color-mix(in srgb, var(--color-primary) 60%, transparent), 0 8px 16px rgba(0,0,0,0.3)',
          cursor: 'default',
          userSelect: 'none',
          pointerEvents: 'none',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Topline Card Title */}
        <span
          className="personality-card__title"
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: 'var(--color-primary)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {card?.cardName || t('card.personality_card', 'Kişilik Kartı')}
        </span>

        {/* Center Avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px 0',
          }}
        >
          <ActorAvatar
            profileName={actorName}
            imageUrl={actorData.imageUrl}
            discriminator={actorData.discriminator}
            actorId={actorData.actorId || actorData.id}
            size="md"
            clickable={false}
          />
        </div>

        {/* Bottom Actor Name */}
        <span
          className="personality-card__hint"
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: 'var(--color-text)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {actorName}
        </span>
      </div>
    )
  }

  if (variant === 'editor') {
    const canConfirm = editorCardName.trim() !== '' && editorPrompt.trim() !== ''

    return (
      <div
        className={`personality-card personality-card--filled personality-card--editor${editorConfirmed ? ' personality-card--editor-confirmed' : ''}`}
      >
        {/* Background Bot Watermark */}
        <div
          className="personality-card__bg-bot"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0,
            opacity: 0.08,
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BotIcon size={120} />
        </div>

        <div className="personality-card__topline">
          {editorConfirmed && (
            <span className="personality-card__title personality-card-editor__confirmed-title">
              {editorCardName}
            </span>
          )}
          {typeof onToggleEditorLock === 'function' && (
            <IconActionButton
              onClick={(e) => {
                e.stopPropagation()
                onToggleEditorLock(!editorLocked)
              }}
              title={
                editorLocked
                  ? t('card.locked_assignment', 'Bu atama kilitli')
                  : t('card.lock_assignment', 'Bu atamayı kilitle')
              }
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                zIndex: 3,
                flexShrink: 0,
                color: editorLocked ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
              }}
            >
              {editorLocked ? (
                <Lock size={13} strokeWidth={2.2} />
              ) : (
                <LockOpen size={13} strokeWidth={2.2} />
              )}
            </IconActionButton>
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
              <Crown size={12} />0
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
    card?.owners?.length ??
    card?.card?.owners?.length ??
    0
  const assignmentCount =
    card?.assignmentCount ??
    card?.card?.assignmentCount ??
    card?.ownership?.assignmentCount ??
    card?.ownership?.originalCard?.assignmentCount ??
    card?.assignments?.length ??
    card?.card?.assignments?.length ??
    0
  const personalityCardId =
    card?.personalityCardId ??
    card?.card?.personalityCardId ??
    card?.ownership?.originalCard?.personalityCardId ??
    card?.cardId ??
    null

  const innerCard = card?.card ?? card?.ownership?.originalCard ?? card
  const currentAcqType = innerCard?.acquisitionType ?? null

  const isAssignedCard = Boolean(
    card?.assignmentId || card?.botId || card?.tribeId || card?.assignedTribeId || tribeAssigned
  )
  const ownerActor = card?.ownership?.actor ?? card?.actor ?? null
  const ownershipId =
    card?.ownershipId ||
    card?.ownership?.ownershipId ||
    (card?.ownership ? card.ownership.ownershipId : null) ||
    null
  const ownerActorId =
    card?.ownership?.actorId ||
    card?.ownership?.actor?.actorId ||
    card?.actorId ||
    ownerActor?.actorId ||
    null

  const rawAssignments = Array.isArray(card?.assignments) ? card.assignments : []
  const assignedBots =
    card?.assignedBots && card.assignedBots.length > 0
      ? card.assignedBots
      : rawAssignments.map((a) => a.bot).filter(Boolean)
  const assignedTribes =
    card?.assignedTribes && card.assignedTribes.length > 0
      ? card.assignedTribes
      : rawAssignments.map((a) => a.tribe).filter(Boolean)
  const hasAssigned = Boolean(assignedBots.length > 0 || assignedTribes.length > 0)

  // Assignment-merkezli mod için tüm assignment'ları normalize et:
  // her öğe kaynak (SourceActor / SourceTribe) + hedef (Bot / Tribe) taşıyabilir.
  const assignmentItems =
    rawAssignments.length > 0
      ? rawAssignments.filter((a) => !a.isDeleted)
      : isAssignedCard
        ? [card]
        : []

  const resolveSourceNode = (item) => {
    if (item?.sourceTribe) return { type: 'tribe', data: item.sourceTribe }
    const src = item?.sourceActor || null
    if (!src) return null
    const srcId = String(src.actorId || src.id || '').toLowerCase()
    const ownId = String(ownerActorId || '').toLowerCase()
    if (ownId && srcId && srcId === ownId) return null
    return { type: 'actor', data: src }
  }

  const resolveTargetNode = (item) => {
    if (item?.bot) return { type: 'actor', data: item.bot }
    if (item?.botId) {
      const fallback = item?.actor || actor || null
      if (fallback) return { type: 'actor', data: fallback }
      return { type: 'actor', data: { actorId: item.botId } }
    }
    if (item?.tribe) return { type: 'tribe', data: item.tribe }
    if (item?.tribeId) return { type: 'tribe', data: { tribeId: item.tribeId } }
    return null
  }

  const collectAssignmentNodes = (resolver) => {
    const nodes = []
    const seen = new Set()
    for (const item of assignmentItems) {
      const node = resolver(item)
      if (!node) continue
      const key = `${node.type}:${String(
        node.data?.actorId || node.data?.tribeId || node.data?.id || ''
      ).toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      nodes.push(node)
    }
    return nodes
  }

  const assignmentSources = collectAssignmentNodes(resolveSourceNode)
  const assignmentTargets = collectAssignmentNodes(resolveTargetNode)
  const hasAssignmentFlow = assignmentSources.length > 0 || assignmentTargets.length > 0

  // Effective lock state: either the explicit `locked` prop or the assignment data's own
  // IsLocked flag (CardAssignmentProjectionDto.isLocked) coming from assignment-centric renders.
  const effectiveLocked = Boolean(
    locked ||
      card?.isLocked ||
      card?.assignment?.isLocked ||
      card?.card?.isLocked ||
      card?.ownership?.originalCard?.isLocked
  )
  // Pending lock intent for cards about to be assigned (not yet persisted).
  const showLockToggle = typeof onToggleLock === 'function' && lockable !== false
  const lockToggleActive = Boolean(assignLocked)
  const isAssignmentLocked = showLockToggle ? lockToggleActive : (effectiveLocked || lockToggleActive)

  const isSelectionDisabled =
    disabled ||
    selectionReadOnly ||
    (selectable && !selected && maxSelections != null && selectedCount >= maxSelections)

  const handleCardClick = () => {
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
      if (selectable) {
        if (!isSelectionDisabled) onSelect?.()
        return
      }
      onClick?.()
      setIsDetailOpen(true)
    }
  }

  return (
    <div
      className={`personality-card ${filled ? 'personality-card--filled' : 'personality-card--empty'}${selectable ? ' personality-card--selectable' : ''}${selected ? ' personality-card--selected' : ''}${isSelectionDisabled ? ' personality-card--selection-disabled' : ''}${selectionReadOnly ? ' personality-card--selection-readonly' : ''}${isAssignedCard ? ' personality-card--owner-assigned' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={filled ? 'button' : undefined}
      tabIndex={filled ? 0 : undefined}
      aria-pressed={selectable ? selected : undefined}
      aria-disabled={disabled || selectionReadOnly}
    >
      {/* Background Bot Watermark */}
      <div
        className="personality-card__bg-bot"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
          opacity: 0.08,
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BotIcon size={120} />
      </div>

      {(currentAcqType === 0 || currentAcqType === 1 || isAssignmentLocked) && (
        <span
          className="personality-card__corner-badges"
          style={{
            position: 'absolute',
            top: -14,
            left: -8,
            zIndex: 3,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            pointerEvents: 'none',
          }}
        >
          {currentAcqType === 0 && (
            <span
              title={t('card.creator_badge', 'Bu kartın yaratıcısısınız (Tüm haklar sizde)')}
              style={{
                color: 'var(--color-warning)',
                filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
                transform: 'rotate(-25deg)',
                pointerEvents: 'auto',
              }}
            >
              <Crown size={28} strokeWidth={2.5} />
            </span>
          )}
          {currentAcqType === 1 && (
            <span
              title={t('card.purchaser_badge', 'Bu kartı satın aldınız')}
              style={{
                color: '#b87333',
                filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
                transform: 'rotate(-18deg)',
                pointerEvents: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Crown size={24} strokeWidth={2.5} />
              <span
                style={{
                  marginLeft: '-4px',
                  marginTop: '4px',
                  fontSize: '25px',
                  fontWeight: '900',
                  fontFamily: '"Arial Black", Impact, system-ui, sans-serif',
                  lineHeight: 1,
                  color: '#22c55e',
                  textShadow: '0 0 3px rgba(34, 197, 94, 0.35), 0 1px 2px rgba(0,0,0,0.8)',
                  WebkitTextStroke: '0.6px #052e16',
                }}
              >
                $
              </span>
            </span>
          )}
          {isAssignmentLocked && (
            <span
              title={t('card.locked_assignment', 'Bu atama kilitli')}
              onClick={
                showLockToggle
                  ? (e) => {
                      e.stopPropagation()
                      onToggleLock(personalityCardId ?? card)
                    }
                  : undefined
              }
              style={{
                color: '#ffffff',
                filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))',
                pointerEvents: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-22deg)',
                cursor: showLockToggle ? 'pointer' : 'default',
              }}
            >
              <Lock size={26} strokeWidth={3} />
            </span>
          )}
        </span>
      )}
      <div className="personality-card__topline">
        <span className="personality-card__eyebrow">{slotNumber ? String(slotNumber) : ''}</span>
        <span className="personality-card__title">
          {cardName.length > 40 ? cardName.substring(0, 40) + '...' : cardName}
        </span>
        {showLockToggle && filled && (
          <IconActionButton
            onClick={(e) => {
              e.stopPropagation()
              onToggleLock(personalityCardId ?? card)
            }}
            title={
              lockToggleActive
                ? t('card.locked_assignment', 'Bu atama kilitli')
                : t('card.lock_assignment', 'Bu atamayı kilitle')
            }
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              zIndex: 3,
              flexShrink: 0,
              color: lockToggleActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
            }}
          >
            {lockToggleActive ? (
              <Lock size={13} strokeWidth={2.2} />
            ) : (
              <LockOpen size={13} strokeWidth={2.2} />
            )}
          </IconActionButton>
        )}
        {onEditClick && filled && (currentAcqType === 0 || currentAcqType === 1) ? (
          <IconActionButton
            onClick={(e) => {
              e.stopPropagation()
              onEditClick(card)
            }}
            title={t('action.edit', 'Düzenle')}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              zIndex: 3,
              flexShrink: 0,
              color: '#ffffff',
            }}
          >
            <Edit2 size={13} strokeWidth={2.2} color="#ffffff" />
          </IconActionButton>
        ) : showMark ? (
          <span className="personality-card__mark">
            <SelectionMarker
              checked={selectionReadOnly ? true : selectable ? selected : filled}
              size="sm"
              locked={false}
              disabled={selectionReadOnly}
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

      {filled && (
        <div
          className="personality-card__footer"
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--color-primary-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {(isAssignedCard
            ? ownerActor || hasAssignmentFlow
            : ownerActor || hasAssigned) && (
            <div className="personality-card__assignment-sources" style={{ margin: 0 }}>
              {/* 1. Top Row: Owner */}
              {ownerActor && (
                <div className="personality-card__assignment-row personality-card__assignment-row--owner">
                  <span className="personality-card__assignment-label personality-card__assignment-label--owner">
                    {t('card.owner_label', 'Sahip')}:
                  </span>
                  <ActorMinimalCard
                    actor={ownerActor}
                    showHierarchyBtn={false}
                    showMindBtn={false}
                    showEditBtn={false}
                    showPoint={false}
                    clickable={true}
                    variant="compact"
                  />
                </div>
              )}

              {isAssignedCard ? (
                <>
                  {/* 2. Assigned bloğu (1. katman - Kaynaklar):
                      "Assigned:" etiketi; sağında kaynak (SourceActor/SourceTribe) ögeleri
                      bitişik (flush) alt alta dizilir. */}
                  {assignmentSources.length > 0 && (
                    <div
                      className={`personality-card__assignment-row personality-card__assignment-row--branch personality-card__assignment-row--assigned personality-card__assignment-row--source-layer${assignmentTargets.length > 0 ? ' personality-card__assignment-row--has-target-layer' : ''}`}
                      style={{ alignItems: 'flex-start' }}
                    >
                      <span
                        className="personality-card__assignment-label personality-card__assignment-label--assigned"
                        style={{ marginTop: '5px' }}
                      >
                        {t('card.assigned_label', 'Assigned')}:
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 2,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {assignmentSources.map((node) =>
                          node.type === 'tribe' ? (
                            <TribeMinimalCard
                              key={`src-tribe-${node.data.tribeId}`}
                              tribeId={node.data.tribeId}
                              tribeName={node.data.tribeName}
                              tribePoint={node.data.tribePoint}
                              imageUrl={node.data.imageUrl}
                              variant="compact"
                              clickable={true}
                              showMindBtn={false}
                              showEditBtn={false}
                              showPoint={false}
                            />
                          ) : (
                            <ActorMinimalCard
                              key={`src-actor-${node.data.actorId}`}
                              actor={node.data}
                              showHierarchyBtn={false}
                              showMindBtn={false}
                              showEditBtn={false}
                              showPoint={false}
                              clickable={true}
                              variant="compact"
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Assigned bloğu (2. katman - Hedefler):
                      kaynak katmanından inen dal; sağında Bot/Tribe ögeleri bitişik (flush) dizilir. */}
                  {assignmentTargets.length > 0 && (
                    <div
                      className={`personality-card__assignment-row personality-card__assignment-row--branch personality-card__assignment-row--assigned personality-card__assignment-row--target-layer${assignmentSources.length > 0 ? ' personality-card__assignment-row--has-source-layer' : ''}`}
                      style={{ alignItems: 'flex-start' }}
                    >
                      <span
                        className="personality-card__assignment-label personality-card__assignment-label--assigned"
                        style={{ marginTop: '5px' }}
                      >
                        {t('card.assigned_label', 'Assigned')}:
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 2,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {assignmentTargets.map((node) =>
                          node.type === 'tribe' ? (
                            <TribeMinimalCard
                              key={`tgt-tribe-${node.data.tribeId}`}
                              tribeId={node.data.tribeId}
                              tribeName={node.data.tribeName}
                              tribePoint={node.data.tribePoint}
                              imageUrl={node.data.imageUrl}
                              variant="compact"
                              clickable={true}
                              showMindBtn={false}
                              showEditBtn={false}
                              showPoint={false}
                            />
                          ) : (
                            <ActorMinimalCard
                              key={`tgt-actor-${node.data.actorId}`}
                              actor={node.data}
                              showHierarchyBtn={false}
                              showMindBtn={false}
                              showEditBtn={false}
                              showPoint={false}
                              clickable={true}
                              variant="compact"
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Ownership Card Mode */
                hasAssigned && (
                  <div
                    className="personality-card__assignment-row personality-card__assignment-row--branch personality-card__assignment-row--assigned"
                    style={{ alignItems: 'flex-start' }}
                  >
                    <span
                      className="personality-card__assignment-label personality-card__assignment-label--assigned"
                      style={{ marginTop: '5px' }}
                    >
                      {t('card.assigned_label', 'Assigned')}:
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 2,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {assignedBots.map((b) => (
                        <ActorMinimalCard
                          key={b.actorId}
                          actor={b}
                          showHierarchyBtn={false}
                          showMindBtn={false}
                          showPoint={false}
                          showEditBtn={false}
                          clickable={true}
                          variant="compact"
                        />
                      ))}
                      {assignedTribes.map((tr) => (
                        <TribeMinimalCard
                          key={tr.tribeId}
                          {...tr}
                          variant="compact"
                          clickable={true}
                          showMindBtn={false}
                          showEditBtn={false}
                          showPoint={false}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div
            className="personality-card__stats"
            style={{
              marginTop: 0,
              paddingTop: 0,
              borderTop: 'none',
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsDetailOpen(true)
              }}
              className="personality-card__stat"
              title={t('card.details', 'Kart Detayları')}
            >
              <Info size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (personalityCardId) setModalType('owners')
              }}
              className="personality-card__stat"
              title={t('card.owners', 'Sahipler')}
            >
              <Crown size={12} />
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

          {personalityCardId && (
            <button
              type="button"
              className="personality-card__hierarchy-btn"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/card-hierarchy?cardId=${personalityCardId}`)
              }}
              title={t('card.view_hierarchy', 'Kart Hiyerarşisi')}
            >
              <Network size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      <CardActorListModal
        cardId={personalityCardId}
        type={modalType}
        isOpen={!!modalType && !!personalityCardId}
        onClose={() => setModalType(null)}
      />

      <CardDetailModal
        card={card}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEditClick={onEditClick}
      />
    </div>
  )
}
