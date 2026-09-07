import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Network,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  RotateCcw,
  Crown,
  Lock,
  Bot as BotIconLucide,
  Users,
  Layers,
  Sparkles,
  CircleAlert,
  CircleMinus,
  CirclePlus,
} from 'lucide-react'
import { personalityCardApi } from '../../api/personalityCardApi'
import BackButton from '../../components/common/BackButton'
import ActorMinimalCard from '../../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../../components/tribe/TribeMinimalCard'
import BotIcon from '../../components/common/icons/BotIcon'

// ── Tree Builder Algorithm ──────────────────────────────────────────────────
function buildCardHierarchyTree(card) {
  if (!card) return null

  const root = {
    id: `card_${card.personalityCardId || 'root'}`,
    nodeType: 'card',
    card: card,
    isRoot: true,
    isDeleted: false,
    children: [],
  }

  const rawOwners = Array.isArray(card.owners) ? card.owners : []
  const rawAssignments = Array.isArray(card.assignments) ? card.assignments : []

  const ownerNodesByOwnershipId = new Map()
  const ownerNodesByActorId = new Map()

  const ownerNodes = rawOwners.map((owner) => {
    const actor = owner.actor || {
      actorId: owner.actorId,
      profileName: 'Bilinmeyen Sahip',
    }
    const node = {
      id: `owner_${owner.ownershipId || owner.actorId}`,
      ownershipId: owner.ownershipId ? String(owner.ownershipId).toLowerCase() : null,
      actorId: owner.actorId ? String(owner.actorId).toLowerCase() : null,
      nodeType: 'owner',
      actor: actor,
      ownership: owner,
      card: card,
      isRoot: false,
      isDeleted: false,
      children: [],
    }
    if (node.ownershipId) ownerNodesByOwnershipId.set(node.ownershipId, node)
    if (node.actorId) ownerNodesByActorId.set(node.actorId, node)
    return node
  })

  for (const ownerNode of ownerNodes) {
    root.children.push(ownerNode)
  }

  const assignmentNodes = rawAssignments.map((ass) => {
    const isBot = Boolean(ass.botId || ass.bot)
    const targetId = isBot ? ass.botId : ass.tribeId
    const targetData = isBot ? ass.bot : ass.tribe

    return {
      id: `assignment_${ass.assignmentId}`,
      assignmentId: ass.assignmentId,
      ownershipId: ass.ownershipId ? String(ass.ownershipId).toLowerCase() : null,
      nodeType: isBot ? 'bot' : 'tribe',
      targetId: targetId ? String(targetId).toLowerCase() : null,
      sourceActorId: ass.sourceActorId ? String(ass.sourceActorId).toLowerCase() : null,
      sourceTribeId: ass.sourceTribeId ? String(ass.sourceTribeId).toLowerCase() : null,
      data:
        targetData ||
        (isBot
          ? { actorId: targetId, profileName: 'Bilinmeyen Bot' }
          : { tribeId: targetId, tribeName: 'Bilinmeyen Kabile' }),
      bot: ass.bot,
      tribe: ass.tribe,
      isDeleted: Boolean(ass.isDeleted),
      isLocked: Boolean(ass.isLocked),
      assignedAt: ass.assignedAt,
      children: [],
    }
  })

  // Index assignment nodes by targetId
  const nodesByTargetId = new Map()
  for (const node of assignmentNodes) {
    if (node.targetId) {
      if (!nodesByTargetId.has(node.targetId)) {
        nodesByTargetId.set(node.targetId, [])
      }
      nodesByTargetId.get(node.targetId).push(node)
    }
  }

  // Connect assignments:
  // 1. If sourceTribeId matches another assignment's targetId -> child of that assignment
  // 2. Else if sourceActorId matches another assignment's targetId -> child of that assignment
  // 3. Else if ownershipId matches an owner node -> child of that owner node
  // 4. Else if sourceActorId matches an owner's actorId -> child of that owner node
  // 5. Else child of root (card)
  for (const node of assignmentNodes) {
    let attached = false

    if (node.sourceTribeId) {
      const parentList = nodesByTargetId.get(node.sourceTribeId)
      if (parentList && parentList.length > 0) {
        parentList[0].children.push(node)
        attached = true
      }
    } else if (node.sourceActorId) {
      const parentList = nodesByTargetId.get(node.sourceActorId)
      if (parentList && parentList.length > 0) {
        parentList[0].children.push(node)
        attached = true
      }
    }

    if (!attached && node.ownershipId) {
      const ownerNode = ownerNodesByOwnershipId.get(node.ownershipId)
      if (ownerNode) {
        ownerNode.children.push(node)
        attached = true
      }
    }

    if (!attached && node.sourceActorId) {
      const ownerNode = ownerNodesByActorId.get(node.sourceActorId)
      if (ownerNode) {
        ownerNode.children.push(node)
        attached = true
      }
    }

    if (!attached) {
      root.children.push(node)
    }
  }

  return root
}

// ── Recursive TreeNode Component ─────────────────────────────────────────────
function CardTreeNode({ node, isAllCollapsed, expandTrigger }) {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (expandTrigger > 0) {
      setIsCollapsed(isAllCollapsed)
    }
  }, [expandTrigger, isAllCollapsed])

  const hasChildren = Boolean(node.children && node.children.length > 0)
  const isDeleted = Boolean(node.isDeleted)

  return (
    <div className="vtree-node">
      <div
        className="vtree-card-wrapper"
        style={{
          position: 'relative',
          opacity: isDeleted ? 0.68 : 1,
          transition: 'all 0.2s ease',
          filter: isDeleted ? 'grayscale(35%)' : 'none',
        }}
      >
        {/* Node Badge: Card / Owner / Tribe / Tombstone */}
        {node.nodeType === 'card' ? (
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: 14,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
              color: '#fff',
              zIndex: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Sparkles size={12} />
            <span>{t('card.card_root', 'Kişilik Kartı')}</span>
          </div>
        ) : node.nodeType === 'owner' ? (
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: 14,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, var(--color-warning), #d97706)',
              color: '#fff',
              zIndex: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Crown size={12} />
            <span>{t('card.owner_badge', 'Kart Sahibi')}</span>
          </div>
        ) : node.nodeType === 'tribe' ? (
          <div
            style={{
              position: 'absolute',
              top: -8,
              right: 12,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              padding: '1px 6px',
              borderRadius: 6,
              background: isDeleted ? '#64748b' : 'var(--color-primary)',
              color: '#fff',
              zIndex: 3,
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}
          >
            {t('tribe.tribe', 'Klan')}
          </div>
        ) : null}

        {/* Deleted / Tombstone Pass-through Bridge Badge */}
        {isDeleted && (
          <div
            style={{
              position: 'absolute',
              top: -8,
              left: 12,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              padding: '1px 6px',
              borderRadius: 6,
              background: 'var(--color-danger, #ef4444)',
              color: '#fff',
              zIndex: 4,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
            title={t('card.deleted_bridge_hint', 'Bu düğüm silinmiş ancak soy ağacı için köprü olarak korunuyor')}
          >
            <CircleAlert size={10} />
            <span>{t('card.tombstone', 'Köprü (Feshedildi)')}</span>
          </div>
        )}

        {/* Locked Badge */}
        {node.isLocked && (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-warning)',
              zIndex: 3,
            }}
            title={t('card.locked', 'Kilitli Atama')}
          >
            <Lock size={11} />
          </div>
        )}

        {/* Render Node Content */}
        {node.nodeType === 'card' ? (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, var(--color-surface)), var(--color-surface))',
              border: '2px solid var(--color-primary)',
              boxShadow: '0 4px 18px rgba(var(--color-primary-rgb, 99, 102, 241), 0.22)',
              minWidth: 220,
              maxWidth: 300,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text)' }}>
                {node.card?.cardName || t('card.personality_card', 'Kişilik Kartı')}
              </span>
            </div>
            {node.card?.cardHint && (
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.35, marginTop: 2 }}>
                {node.card.cardHint}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              <span>
                {t('card.owners', 'Sahip')}:{' '}
                <strong style={{ color: 'var(--color-text)' }}>
                  {node.card?.ownershipCount ?? node.card?.owners?.length ?? 0}
                </strong>
              </span>
              <span>•</span>
              <span>
                {t('card.assignees', 'Atama')}:{' '}
                <strong style={{ color: 'var(--color-text)' }}>
                  {node.card?.assignmentCount ?? node.card?.assignments?.length ?? 0}
                </strong>
              </span>
            </div>
          </div>
        ) : node.nodeType === 'tribe' ? (
          <TribeMinimalCard
            tribeId={node.tribe?.tribeId || node.data?.tribeId}
            tribeName={node.tribe?.tribeName || node.data?.tribeName}
            tribePoint={node.tribe?.tribePoint ?? node.data?.tribePoint}
            imageUrl={node.tribe?.imageUrl || node.data?.imageUrl}
            clickable={true}
            variant="expanded"
            style={{
              margin: 0,
              minWidth: 190,
              borderColor: isDeleted ? 'var(--color-border)' : undefined,
            }}
          />
        ) : (
          <ActorMinimalCard
            actor={node.actor || node.bot || node.data}
            showHierarchyBtn={true}
            clickable={true}
            variant="expanded"
            chipStyle={
              node.nodeType === 'owner'
                ? {
                    background: 'color-mix(in srgb, var(--color-warning) 8%, var(--color-surface))',
                    borderColor: 'var(--color-warning)',
                    boxShadow: '0 3px 10px rgba(217, 119, 6, 0.18)',
                    minWidth: 195,
                  }
                : {
                    background: 'var(--color-surface)',
                    borderColor: isDeleted ? 'var(--color-border)' : 'var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    minWidth: 190,
                  }
            }
          />
        )}

        {/* Toggle Expand/Collapse Button */}
        {hasChildren && (
          <button
            type="button"
            className="vtree-toggle-btn"
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed((c) => !c)
            }}
            title={
              isCollapsed
                ? t('hierarchy.expand', 'Genişlet')
                : t('hierarchy.collapse', 'Daralt')
            }
          >
            {isCollapsed ? <CirclePlus size={16} /> : <CircleMinus size={16} />}
          </button>
        )}
      </div>

      {/* Children Branches */}
      {hasChildren && !isCollapsed && (
        <div className="vtree-children-container">
          <div className="vtree-stem-down" />
          <div className="vtree-children-row">
            {node.children.map((child) => (
              <div key={child.id} className="vtree-child-branch">
                <div className="vtree-branch-line" />
                <CardTreeNode
                  node={child}
                  isAllCollapsed={isAllCollapsed}
                  expandTrigger={expandTrigger}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page Component ─────────────────────────────────────────────────────
export default function PersonalityCardHierarchyPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const cardId = searchParams.get('cardId') || searchParams.get('ownershipId')
  const navigate = useNavigate()

  const [cardData, setCardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(0.85)
  const [isAllCollapsed, setIsAllCollapsed] = useState(false)
  const [expandTrigger, setExpandTrigger] = useState(0)

  // Drag-to-pan state & refs
  const containerRef = useRef(null)
  const [isPanning, setIsPanning] = useState(false)
  const panState = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    hasMoved: false,
  })

  const loadHierarchy = useCallback(async () => {
    if (!cardId) {
      setIsLoading(false)
      setError(t('card.no_card_id', 'Kart ID bilgisi bulunamadı.'))
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const res = await personalityCardApi.getCardHierarchy(cardId)
      const payload = res.data?.data !== undefined ? res.data.data : res.data
      if (payload && (payload.personalityCardId || payload.cardId || res.data?.success)) {
        setCardData(payload)
      } else {
        setError(res.data?.message || t('card.load_failed', 'Hiyerarşi verisi yüklenemedi.'))
      }
    } catch (err) {
      console.error('Failed to fetch card hierarchy:', err)
      setError(err.response?.data?.message || t('card.load_error', 'Bağlantı hatası oluştu.'))
    } finally {
      setIsLoading(false)
    }
  }, [cardId, t])

  useEffect(() => {
    loadHierarchy()
  }, [loadHierarchy])

  const treeRoot = useMemo(() => {
    return buildCardHierarchyTree(cardData)
  }, [cardData])

  // Mouse pan event handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('button, input, textarea, a, select')) return

    const container = containerRef.current
    if (!container) return

    panState.current = {
      isDown: true,
      startX: e.pageX,
      startY: e.pageY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      hasMoved: false,
    }
    setIsPanning(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!panState.current.isDown) return
      const container = containerRef.current
      if (!container) return

      const deltaX = e.pageX - panState.current.startX
      const deltaY = e.pageY - panState.current.startY

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        panState.current.hasMoved = true
      }

      container.scrollLeft = panState.current.scrollLeft - deltaX
      container.scrollTop = panState.current.scrollTop - deltaY
    }

    const handleMouseUp = () => {
      if (panState.current.isDown) {
        panState.current.isDown = false
        setIsPanning(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleClickCapture = (e) => {
    if (panState.current.hasMoved) {
      e.stopPropagation()
      e.preventDefault()
      panState.current.hasMoved = false
    }
  }

  // Mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05
      setZoomLevel((prev) => {
        const next = +(prev + zoomDelta).toFixed(2)
        return Math.min(2.0, Math.max(0.3, next))
      })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const handleToggleAll = () => {
    setIsAllCollapsed((prev) => !prev)
    setExpandTrigger((c) => c + 1)
  }

  const card = cardData
  const ownersCount = cardData?.owners?.length ?? cardData?.ownershipCount ?? 0
  const assignmentsCount = cardData?.assignments?.length ?? cardData?.assignmentCount ?? 0

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 65px)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── Floating Controls & Header ──────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Left: Back button & Card Identity Badge */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '6px 14px',
            boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
            maxWidth: '55%',
          }}
        >
          <BackButton />
          <div style={{ width: 1, height: 24, background: 'var(--color-border)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Network size={16} color="var(--color-primary)" />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {card?.cardName || t('card.personality_card', 'Kişilik Kartı')}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-bg)',
                  padding: '2px 6px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                }}
              >
                {t('card.hierarchy', 'Hiyerarşi Ağacı')}
              </span>
            </div>

            {card?.personalityPrompt && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 380,
                  marginTop: 1,
                }}
                title={card.personalityPrompt}
              >
                {card.personalityPrompt}
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls Toolbar */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '6px 12px',
            boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
          }}
        >
          {/* Owners Count Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              padding: '0 4px',
            }}
            title={t('card.total_owners', 'Toplam Sahip Sayısı')}
          >
            <Users size={14} color="var(--color-warning)" />
            <span>{ownersCount}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{t('card.owners', 'Sahip')}</span>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

          {/* Node Count Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              padding: '0 4px',
            }}
            title={t('card.total_assignments', 'Toplam Atama Sayısı')}
          >
            <BotIconLucide size={14} color="var(--color-primary)" />
            <span>{assignmentsCount}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{t('card.assignees', 'Atama')}</span>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

          {/* Zoom Level Indicator */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              minWidth: 42,
              textAlign: 'center',
            }}
          >
            {Math.round(zoomLevel * 100)}%
          </span>

          {/* Zoom Controls */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setZoomLevel((z) => Math.min(2.0, +(z + 0.1).toFixed(2)))}
            title={t('hierarchy.zoom_in', 'Büyüt (+)')}
            style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setZoomLevel((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}
            title={t('hierarchy.zoom_out', 'Küçült (-)')}
            style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setZoomLevel(0.85)}
            title={t('hierarchy.reset_zoom', 'Sıfırla')}
            style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RotateCcw size={13} />
          </button>

          <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

          {/* Expand / Collapse All */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleToggleAll}
            disabled={!treeRoot}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isAllCollapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            <span>{isAllCollapsed ? t('hierarchy.expand_all', 'Tümünü Genişlet') : t('hierarchy.collapse_all', 'Tümünü Daralt')}</span>
          </button>
        </div>
      </div>

      {/* ── Main Canvas (Drag-to-pan & Zoom) ────────────────────────────────── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'auto',
          cursor: isPanning ? 'grabbing' : 'grab',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
            }}
          >
            <div className="spinner spinner-lg" />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
              {t('card.loading_hierarchy', 'Kart hiyerarşisi yükleniyor...')}
            </span>
          </div>
        ) : error ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
            }}
          >
            <CircleAlert size={36} color="var(--color-danger, #ef4444)" />
            <span style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: 16 }}>
              {error}
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={loadHierarchy}
            >
              {t('action.retry', 'Tekrar Dene')}
            </button>
          </div>
        ) : treeRoot ? (
          <div
            style={{
              minWidth: 'max-content',
              minHeight: 'max-content',
              padding: '120px 80px 160px 80px',
              display: 'flex',
              justifyContent: 'center',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <CardTreeNode
              node={treeRoot}
              isAllCollapsed={isAllCollapsed}
              expandTrigger={expandTrigger}
            />
          </div>
        ) : null}
      </div>

      {/* ── Bottom Legend ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
            <span>{t('card.card_root', 'Kişilik Kartı')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)' }} />
            <span>{t('card.owner_label', 'Sahip')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
            <span>{t('card.direct_assignment', 'Aktif Atama')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-danger, #ef4444)' }} />
            <span>{t('card.tombstone_bridge', 'Köprü (Feshedildi/Silindi)')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
