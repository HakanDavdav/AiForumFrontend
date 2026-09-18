import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Network,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Crown,
  Focus,
  Bot as BotIconLucide,
  Users,
  Layers,
  CircleAlert,
  CircleMinus,
  CirclePlus,
} from 'lucide-react'
import { personalityCardApi } from '../../api/personalityCardApi'
import BackButton from '../../components/common/BackButton'
import ActorMinimalCard from '../../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../../components/tribe/TribeMinimalCard'
import BotIcon from '../../components/common/icons/BotIcon'
import PersonalityCard from '../../components/card/PersonalityCard'
import HierarchyConnectionsOverlay from '../../components/hierarchy/HierarchyConnectionsOverlay'

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

  const ownerNodes = rawOwners.map((owner, idx) => {
    const actor = owner.actor || {
      actorId: owner.actorId,
      profileName: 'Bilinmeyen Sahip',
    }
    const node = {
      id: `owner_${owner.ownershipId || owner.actorId || idx}`,
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

  const assignmentNodes = rawAssignments.map((ass, idx) => {
    const isBot = Boolean(ass.botId || ass.bot)
    const targetId = isBot ? ass.botId : ass.tribeId
    const targetData = isBot ? ass.bot : ass.tribe

    return {
      id: `assignment_${ass.assignmentId || idx}`,
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
          : { tribeId: targetId, tribeName: 'Bilinmeyen Klan' }),
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
function CardTreeNode({ node, isAllCollapsed, expandTrigger, parentId = null }) {
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
    <div className={`vtree-node${node.nodeType === 'tribe' ? ' vtree-node--tribe' : ''}`}>
      <div
        className="vtree-card-wrapper"
        data-node-id={node.id}
        data-parent-id={parentId || undefined}
        style={{
          position: 'relative',
          opacity: isDeleted ? 0.68 : 1,
          transition: 'all 0.2s ease',
          filter: isDeleted ? 'grayscale(35%)' : 'none',
        }}
      >
        {/* Node Badge: Card Owner Crown */}
        {node.nodeType === 'owner' ? (
          <div
            style={{
              position: 'absolute',
              top: -9,
              left: 14,
              padding: '3px 6px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, var(--color-warning), #d97706)',
              color: '#fff',
              zIndex: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
            title={t('card.owner_badge', 'Kart Sahibi')}
          >
            <Crown size={12} strokeWidth={2.5} />
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

        {/* Render Node Content */}
        {node.nodeType === 'card' ? (
          <div style={{ width: 270, maxWidth: 290, textAlign: 'left' }}>
            <PersonalityCard card={node.card} showMark={false} />
          </div>
        ) : node.nodeType === 'tribe' ? (
          <div style={{ position: 'relative', width: '100%', minWidth: 180 }}>
            <TribeMinimalCard
              tribeId={node.tribe?.tribeId || node.data?.tribeId}
              tribeName={node.tribe?.tribeName || node.data?.tribeName}
              tribePoint={node.tribe?.tribePoint ?? node.data?.tribePoint}
              imageUrl={node.tribe?.imageUrl || node.data?.imageUrl}
              variant="expanded"
              clickable={true}
              style={{
                margin: 0,
                minWidth: 180,
                width: '100%',
                background: 'var(--color-surface)',
                borderColor: isDeleted ? 'var(--color-border)' : 'var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                transform: 'none',
              }}
            />

            {/* Tribe alt alanı: Üst karttan ince line ile ayrılan, siyah/arka plan ile bütünleşik bot listesi */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                marginTop: -1,
                background: 'var(--color-bg)',
                borderLeft: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
                borderTop: '1px solid var(--color-border)',
                borderBottomLeftRadius: 'var(--radius-md, 8px)',
                borderBottomRightRadius: 'var(--radius-md, 8px)',
                boxSizing: 'border-box',
              }}
            >
              {/* 3 Bot İkonu ve Dikey ... */}
              <div
                className="vtree-tribe-bots"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  paddingLeft: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  gap: 8,
                }}
              >
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="vtree-tribe-bot-icon"
                    title={t('common.bot', 'Bot')}
                  >
                    <BotIcon size={26} />
                  </div>
                ))}

                {/* Dikey üç nokta (...) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    gap: 4,
                    padding: '2px 0 4px',
                  }}
                  title={t('common.more', 'Daha fazla')}
                >
                  {[0, 1, 2].map((dotIdx) => (
                    <span
                      key={dotIdx}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        boxShadow: '0 0 4px var(--color-primary-shadow)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
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
            {isCollapsed ? <CirclePlus size={28} strokeWidth={2.2} /> : <CircleMinus size={28} strokeWidth={2.2} />}
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
                  parentId={node.id}
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
  const [isViewReady, setIsViewReady] = useState(false)
  // Sınırsız pan: scroll sınırları yerine transform translate ile her yöne serbest kaydırma
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isAllCollapsed, setIsAllCollapsed] = useState(false)
  const [expandTrigger, setExpandTrigger] = useState(0)

  const blockRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  // Drag-to-pan state & refs
  const containerRef = useRef(null)
  const [isPanning, setIsPanning] = useState(false)
  const panState = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
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

  const treeContainerRef = useRef(null)

  const treeRoot = useMemo(() => {
    return buildCardHierarchyTree(cardData)
  }, [cardData])

  // İlk giriş (oto-zoom) ile Default butonunun birebir aynı görünümü üretmesi için ortak rutin:
  // içeriğe sığacak zoom hesapla → yatayda ortala (pan) → dikeyde başlangıcı en üstte tut.
  // Kök node'u ekranın yatay merkezine oturtur.
  // Ölçüm transform'u (mevcut pan'ı) da içerdiği için DELTA olarak uygulanır ve
  // mevcut pan'a eklenir; böylece Default art arda basılsa da sola/ortaya zıplamaz.
  const centerRootOnView = () => {
    const container = containerRef.current
    if (!container) return
    const rootEl = container.querySelector('.vtree-node')
    if (!rootEl) return
    const c = container.getBoundingClientRect()
    const r = rootEl.getBoundingClientRect()
    const deltaX = c.left + c.width / 2 - (r.left + r.width / 2)

    // İçerik görünüm alanından kısaysa dikeyde ortala (tek owner'lı gibi kısa ağaçlarda
    // owner altta tek başına kalmasın); uzunsa üstten başlasın.
    let targetY = 0
    const zoomEl = treeContainerRef.current
    if (zoomEl) {
      const contentH = zoomEl.offsetHeight
      if (contentH < container.clientHeight) {
        targetY = (container.clientHeight - contentH) / 2
      }
    }

    setPanOffset((prev) => ({ x: prev.x + deltaX, y: targetY }))
  }

  // Doğal boyut ilk seferde ölçülüp önbelleğe alınır; Default'a art arda basınca sapma (drift) olmaz.
  const naturalSizeRef = useRef(null)

  const fitToDefaultView = () => {
    const container = containerRef.current
    const zoomEl = treeContainerRef.current
    if (!container || !zoomEl || !treeRoot) return

    let natW = 0
    let natH = 0
    if (naturalSizeRef.current) {
      natW = naturalSizeRef.current.w
      natH = naturalSizeRef.current.h
    } else {
      if (zoomEl.offsetWidth === 0) return
      const currentZoom = zoomLevel > 0 ? zoomLevel : 0.85
      // Dekoratif padding'leri (üst 130 + alt 48, sağ/sol 40'ar) doğal boyuttan düş;
      // böylece gerçek node alanına göre fit yapılır ve Default hem yakın hem tam sığar.
      natW = Math.max(1, (zoomEl.offsetWidth - 80) / currentZoom)
      natH = Math.max(1, (zoomEl.offsetHeight - 178) / currentZoom)
      naturalSizeRef.current = { w: natW, h: natH }
    }

    const availW = Math.max(1, container.clientWidth - 8)
    const availH = Math.max(1, container.clientHeight - 8)
    const fit = Math.min(availW / Math.max(1, natW), availH / Math.max(1, natH))
    // Her şeyi sığdır: bonus yok, zoom en fazla %100; çok büyük içerikte de iyice küçülerek tümünü gösterir.
    const nextZoom = Math.max(0.02, Math.min(1.0, +(fit).toFixed(2)))

    setZoomLevel(nextZoom)

    // Yeni zoom'un render commit'ini garanti altına almak için çift rAF ile merkezle.
    // Aksi halde 80ms'lik sabit timeout, yeni zoom'dan ÖNCE ölçüm yapıp pan'ı kaydırır
    // (Default'a art arda basınca görünümün sürekli değişmesine yol açar).
    requestAnimationFrame(() => requestAnimationFrame(() => centerRootOnView()))
  }

  const handleDefaultView = () => fitToDefaultView()

  // Ağaç ilk yüklendiğinde: gizli render → oto-zoom + ortala → tek karede göster (flicker yok)
  useEffect(() => {
    if (!treeRoot || !containerRef.current) {
      setIsViewReady(false)
      return
    }
    setIsViewReady(false)
    const container = containerRef.current
    container.scrollLeft = 0
    container.scrollTop = 0
    const timer = setTimeout(() => {
      const zoomEl = treeContainerRef.current
      if (!zoomEl || zoomEl.offsetWidth === 0) {
        setIsViewReady(true)
        return
      }
      fitToDefaultView()
      setTimeout(() => setIsViewReady(true), 140)
    }, 150)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeRoot])

  // Mouse pan event handlers (transform tabanlı sınırsız kaydırma)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('button, input, textarea, a, select')) return

    const container = containerRef.current
    if (!container) return

    panState.current = {
      isDown: true,
      startX: e.pageX,
      startY: e.pageY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
      hasMoved: false,
    }
    setIsPanning(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!panState.current.isDown) return

      const deltaX = e.pageX - panState.current.startX
      const deltaY = e.pageY - panState.current.startY

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        panState.current.hasMoved = true
      }

      // Transform bazlı sınırsız pan: scroll alanına takılmaz, istenildiği kadar gidilir
      setPanOffset({
        x: panState.current.startPanX + deltaX,
        y: panState.current.startPanY + deltaY,
      })
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

  // Bloğa tıklandığında focus alması, dışına tıklandığında bırakması
  useEffect(() => {
    const handleDocumentMouseDown = (e) => {
      if (blockRef.current && blockRef.current.contains(e.target)) {
        setIsFocused(true)
      } else {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
    }
  }, [])

  // İçeride tekerlekle kaydırmayı engelle, ana sayfaya aktar
  useEffect(() => {
    const targetEl = blockRef.current || containerRef.current
    if (!targetEl) return

    const handleWheel = (e) => {
      e.preventDefault()
      const scrollContainer = document.getElementById('scroll-container')
      if (
        scrollContainer &&
        scrollContainer.scrollHeight > scrollContainer.clientHeight &&
        getComputedStyle(scrollContainer).overflowY !== 'visible'
      ) {
        scrollContainer.scrollBy({ top: e.deltaY, behavior: 'auto' })
      } else {
        window.scrollBy({ top: e.deltaY, behavior: 'auto' })
      }
    }

    targetEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      targetEl.removeEventListener('wheel', handleWheel)
    }
  }, [isLoading])

  const handleToggleAll = () => {
    setIsAllCollapsed((prev) => !prev)
    setExpandTrigger((c) => c + 1)
  }

  const card = cardData
  const ownersCount = cardData?.owners?.length ?? cardData?.ownershipCount ?? 0
  const assignmentsCount = cardData?.assignments?.length ?? cardData?.assignmentCount ?? 0

  return (
    <div
      ref={blockRef}
      style={{
        width: '100%',
        height: 'calc(100vh - 135px)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: isFocused ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
        boxShadow: isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
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
          alignItems: 'flex-start',
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
              minHeight: 44,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '6px 14px',
              boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
              maxWidth: '55%',
            }}
          >
            <BackButton style={{ marginBottom: 0, width: 30, height: 30, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} />
            <div style={{ width: 1, height: 24, background: 'var(--color-border)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Network size={16} color="var(--color-primary)" style={{ flexShrink: 0, display: 'block' }} />
            <span
              style={{
                fontWeight: 800,
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}
            >
              {t('hierarchy.card_hierarchy_title', 'Card Hierarchy')}
            </span>
            <span style={{ color: 'var(--color-primary)', flexShrink: 0, transform: 'translateY(-1px)' }}>•</span>
            <span
              onClick={() => {
                navigate('/cards')
              }}
              title={t('common.open_cards', 'Kartları aç')}
              style={{
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 1,
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                transform: 'translateY(1px)',
                minWidth: 0,
              }}
            >
              {card?.cardName ? `${card.cardName}` : t('hierarchy.no_name', 'isim')}
            </span>
          </div>
        </div>

        {/* Right: Controls Toolbar */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 44,
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
            <Crown size={14} color="var(--color-warning)" />
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
            onClick={() => setZoomLevel((z) => Math.max(0.05, +(z - 0.1).toFixed(2)))}
            title={t('hierarchy.zoom_out', 'Küçült (-)')}
            style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Minus size={14} />
          </button>

          <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

          {/* Expand / Collapse All */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleToggleAll}
            disabled={!treeRoot}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 16px', height: 32 }}
          >
            {isAllCollapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            <span>{isAllCollapsed ? t('hierarchy.expand_all', 'Tümünü Genişlet') : t('hierarchy.collapse_all', 'Tümünü Daralt')}</span>
          </button>

          <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

          {/* Default Görünüm */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleDefaultView}
            disabled={!treeRoot}
            title={t('hierarchy.default_view', 'Varsayılan görünüme dön')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 16px', height: 32 }}
          >
            <Focus size={13} />
            <span>Default</span>
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
          overflow: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
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
              visibility: isViewReady ? 'visible' : 'hidden',
              transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
              willChange: 'transform',
              width: 'max-content',
            }}
          >
          <div
            ref={treeContainerRef}
            className="hierarchy-tree-container"
            style={{
              zoom: zoomLevel,
              '--tree-zoom': zoomLevel,
              minWidth: 'max-content',
              minHeight: 'max-content',
              padding: '130px 40px 48px 40px',
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <HierarchyConnectionsOverlay
              containerRef={treeContainerRef}
              data={treeRoot}
              rootActorId={null}
              expandCounter={expandTrigger}
              zoomLevel={zoomLevel}
              enableCardTravel={false}
              pulseInterval={0}
            />
            <CardTreeNode
              node={treeRoot}
              parentId={null}
              isAllCollapsed={isAllCollapsed}
              expandTrigger={expandTrigger}
            />
          </div>
          </div>
        ) : null}
      </div>

      {/* Auto-zoom hazırlanırken tek karede final görünüm için gizli yükleme spinner'ı */}
      {treeRoot && !isViewReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div className="spinner spinner-lg" />
        </div>
      )}
    </div>
  )
}
