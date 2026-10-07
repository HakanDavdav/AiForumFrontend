import { useState, useEffect, useRef, useCallback } from 'react'
import { CirclePlus, CircleMinus } from 'lucide-react'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import BotIcon from '../common/icons/BotIcon'
import TRexSkullIcon from '../../assets/t-rex-skull-svgrepo-com.svg?react'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import HierarchyConnectionsOverlay from './HierarchyConnectionsOverlay'

// ── Lineage Helpers ─────────────────────────────────────────────────────────

/**
 * Bir bot düğümünün altında özyinelemeli olarak herhangi bir aktif alt birim var mı?
 */
function hasActiveDescendants(bot) {
  if (!bot) return false
  if (bot.bots && bot.bots.length > 0) {
    for (const child of bot.bots) {
      if (!(child.isDormant ?? child.IsDormant ?? false)) return true
      if (hasActiveDescendants(child)) return true
    }
  }
  if (bot.tribes && bot.tribes.length > 0) {
    for (const t of bot.tribes) {
      if (!(t.isDormant ?? t.IsDormant ?? false)) return true
    }
  }
  return false
}

/**
 * Bypassed fosil atanın altındaki aktif torunları atalar zinciriyle (_fossilAncestors) topla
 */
function collectPromotedActiveBots(fossilBot, ancestorsSoFar = [], expandedAncestorIds = new Set()) {
  const currentAncestors = [...ancestorsSoFar, fossilBot]
  const promoted = []

  if (fossilBot.bots && fossilBot.bots.length > 0) {
    for (const child of fossilBot.bots) {
      const isChildDormant = Boolean(child.isDormant ?? child.IsDormant ?? false)
      if (!isChildDormant) {
        // Aktif çocuk bulundu -> ata zinciriyle birlikte yukarı terfi ettir
        promoted.push({
          ...child,
          _fossilAncestors: currentAncestors,
        })
      } else if (hasActiveDescendants(child)) {
        if (expandedAncestorIds.has(child.actorId)) {
          promoted.push({
            ...child,
            _isEnjectedFossil: true,
            _fossilAncestors: currentAncestors,
          })
        } else {
          promoted.push(...collectPromotedActiveBots(child, currentAncestors, expandedAncestorIds))
        }
      }
    }
  }

  return promoted
}

function TribeBranch({ tribe, parentActorId, t }) {
  return (
    <div
      key={tribe.tribeId || tribe.id}
      className="vtree-child-branch vtree-child-branch--tribe"
    >
      <div className="vtree-branch-line" />
      <div className="vtree-node vtree-node--tribe">
        <div
          className="vtree-card-wrapper"
          data-tribe-id={tribe.tribeId || tribe.id}
          data-parent-id={parentActorId}
        >
          <div style={{ position: 'relative' }}>
            <TribeMinimalCard
              tribe={tribe}
              tribeId={tribe.tribeId || tribe.id}
              tribeName={tribe.tribeName || tribe.name}
              tribePoint={tribe.tribeActorPoint ?? tribe.point}
              imageUrl={tribe.imageUrl}
              isDormant={tribe.isDormant ?? tribe.IsDormant ?? false}
              assignedCardIds={tribe.assignedCardIds || tribe.AssignedCardIds}
              variant="expanded"
              clickable={true}
              style={{
                margin: 0,
                minWidth: 180,
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
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
        </div>
      </div>
    </div>
  )
}

function TreeNode({
  node,
  setTreeData,
  expandCounter,
  fetchDepth,
  rootActorId,
  parentId = null,
  showFossils = false,
  expandedAncestorIds,
  onToggleAncestor,
  fossilAncestors = null,
  isEnjectedFossil = false,
}) {
  const { t } = useTranslation()
  const [isExpanding, setIsExpanding] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [localFossilExpanded, setLocalFossilExpanded] = useState(null)

  useEffect(() => {
    if (expandCounter > 0) {
      setIsCollapsed(false)
      if (showFossils) {
        setLocalFossilExpanded(true)
      } else {
        setLocalFossilExpanded(false)
      }
    }
  }, [expandCounter, showFossils])

  // Çocukları aktif, enjekte fosil ata ve saf fosil olarak ayrıştır
  const allTribes = node.tribes || []
  const allBots = node.bots || []

  const activeTribes = allTribes.filter((t) => !(t.isDormant ?? t.IsDormant ?? false))
  const fossilTribes = allTribes.filter((t) => Boolean(t.isDormant ?? t.IsDormant ?? false))

  const directActiveBots = allBots.filter((b) => !(b.isDormant ?? b.IsDormant ?? false))
  const allFossilBots = allBots.filter((b) => Boolean(b.isDormant ?? b.IsDormant ?? false))

  const pureFossilBots = []
  const fossilAncestorsWithActiveDescendants = []

  for (const fBot of allFossilBots) {
    if (hasActiveDescendants(fBot)) {
      fossilAncestorsWithActiveDescendants.push(fBot)
    } else {
      pureFossilBots.push(fBot)
    }
  }

  let displayActiveBots = [...directActiveBots]
  let enjectedFossilBots = []

  if (showFossils) {
    // Global fosiller açıksa her şey normal fosil listesinde görünür
    pureFossilBots.push(...fossilAncestorsWithActiveDescendants)
  } else {
    for (const fBot of fossilAncestorsWithActiveDescendants) {
      if (expandedAncestorIds?.has(fBot.actorId)) {
        // Kullanıcı bu fosil atayı araya enjekte etti!
        enjectedFossilBots.push(fBot)
      } else {
        // Sanal Atlama (Virtual Bypass) -> Altındaki aktif torunları topla ve üste bağla!
        const promoted = collectPromotedActiveBots(fBot, [], expandedAncestorIds)
        displayActiveBots.push(...promoted)
      }
    }
  }

  const totalActive = activeTribes.length + displayActiveBots.length + enjectedFossilBots.length
  const totalPureFossils = pureFossilBots.length + fossilTribes.length
  const hasChildren = totalActive > 0 || totalPureFossils > 0

  const effectiveFossilExpanded = localFossilExpanded !== null ? localFossilExpanded : showFossils

  const noMoreChildren = node._checked && !hasChildren
  const isRoot = node.actorId === rootActorId

  const handleToggle = () => {
    if (hasChildren) {
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <div className="vtree-node">
      {/* ── Sanal Atlama Köprü Rozeti (Bypass Bridge Badge) ────────────────── */}
      {fossilAncestors && fossilAncestors.length > 0 && (
        <div className="vtree-ancestor-bridge-pill-wrapper">
          <button
            type="button"
            className="vtree-ancestor-bridge-pill"
            onClick={(e) => {
              e.stopPropagation()
              // Doğrudan aradaki fosil atayı aç
              if (onToggleAncestor) {
                onToggleAncestor(fossilAncestors[fossilAncestors.length - 1].actorId)
              }
            }}
            title={t('hierarchy.show_fossil_ancestor_tooltip', {
              name: fossilAncestors.map((a) => a.profileName || a.name || 'Fosil').join(' → '),
            })}
          >
            <TRexSkullIcon className="badge-fossil-icon" />
            {fossilAncestors.length > 1 && (
              <span style={{ fontSize: 10, fontWeight: 800, paddingRight: 1 }}>{fossilAncestors.length}</span>
            )}
            <CirclePlus size={12} strokeWidth={2.4} />
          </button>
        </div>
      )}

      {/* ── Araya Enjekte Edilmiş Fosil Ata Rozeti (Kapatma Butonu) ─────────── */}
      {isEnjectedFossil && (
        <div className="vtree-ancestor-bridge-pill-wrapper">
          <button
            type="button"
            className="vtree-ancestor-bridge-pill vtree-ancestor-bridge-pill--expanded"
            onClick={(e) => {
              e.stopPropagation()
              if (onToggleAncestor) {
                onToggleAncestor(node.actorId)
              }
            }}
            title={t('hierarchy.collapse_fossil_ancestor_tooltip', 'Fosil atayı daralt ve alt birimleri doğrudan üste bağla')}
          >
            <TRexSkullIcon className="badge-fossil-icon" />
            <CircleMinus size={12} strokeWidth={2.4} />
          </button>
        </div>
      )}

      <div
        className="vtree-card-wrapper"
        data-node-id={node.actorId}
        data-parent-id={parentId || undefined}
      >
        <ActorMinimalCard
          actor={node}
          showHierarchyBtn={true}
          clickable={true}
          variant="expanded"
          chipStyle={
            isRoot
              ? {
                  background: 'var(--color-primary-light)',
                  borderColor: 'var(--color-primary-dark)',
                  boxShadow: '0 4px 14px var(--color-primary-shadow)',
                }
              : isEnjectedFossil
                ? {
                    background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))',
                    borderColor: 'var(--color-primary)',
                    boxShadow: '0 3px 10px var(--color-primary-shadow)',
                  }
                : {
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                  }
          }
        />

        {!noMoreChildren && (
          <button
            onClick={handleToggle}
            disabled={isExpanding}
            className="vtree-toggle-btn"
            title={
              hasChildren
                ? isCollapsed
                  ? t('hierarchy.expand', 'Genişlet')
                  : t('hierarchy.collapse', 'Daralt')
                : t('hierarchy.load_sub_bots', 'Alt birimleri yükle')
            }
          >
            {isExpanding ? (
              <div
                className="spinner spinner-sm"
                style={{ width: 20, height: 20, borderWidth: 2.2 }}
              />
            ) : hasChildren && !isCollapsed ? (
              <CircleMinus size={28} strokeWidth={2.2} />
            ) : (
              <CirclePlus size={28} strokeWidth={2.2} />
            )}
          </button>
        )}
      </div>

      {hasChildren && !isCollapsed && (
        <div className="vtree-children-container">
          <div className="vtree-stem-down" />
          <div className="vtree-children-row">
            {/* 1. Aktif Klanlar (Tribes) */}
            {activeTribes.map((tribe) => (
              <TribeBranch
                key={tribe.tribeId || tribe.id}
                tribe={tribe}
                parentActorId={node.actorId}
                t={t}
              />
            ))}

            {/* 2. Araya Enjekte Edilmiş Fosil Atalar */}
            {enjectedFossilBots.map((child) => (
              <div key={`enjected-${child.actorId}`} className="vtree-child-branch vtree-child-branch--enjected-fossil">
                <div className="vtree-branch-line" />
                <TreeNode
                  node={child}
                  parentId={node.actorId}
                  setTreeData={setTreeData}
                  expandCounter={expandCounter}
                  fetchDepth={fetchDepth}
                  rootActorId={rootActorId}
                  showFossils={showFossils}
                  expandedAncestorIds={expandedAncestorIds}
                  onToggleAncestor={onToggleAncestor}
                  isEnjectedFossil={true}
                />
              </div>
            ))}

            {/* 3. Aktif & Terfi Etmiş Botlar */}
            {displayActiveBots.map((child) => (
              <div key={child.actorId} className="vtree-child-branch">
                <div className="vtree-branch-line" />
                <TreeNode
                  node={child}
                  parentId={node.actorId}
                  setTreeData={setTreeData}
                  expandCounter={expandCounter}
                  fetchDepth={fetchDepth}
                  rootActorId={rootActorId}
                  showFossils={showFossils}
                  expandedAncestorIds={expandedAncestorIds}
                  onToggleAncestor={onToggleAncestor}
                  fossilAncestors={child._fossilAncestors}
                  isEnjectedFossil={Boolean(child._isEnjectedFossil)}
                />
              </div>
            ))}

            {/* 4. Saf Fosil Birimleri Grubu (Açılım Noktasında Sabit Hap + Alt Dallar) */}
            {totalPureFossils > 0 && (
              <div className="vtree-child-branch vtree-child-branch--fossil-group">
                <div className="vtree-branch-line" />
                <div
                  className="vtree-card-wrapper"
                  data-node-id={`fossil-pill-${node.actorId}`}
                  data-parent-id={node.actorId}
                >
                  <button
                    type="button"
                    className={`vtree-fossil-pill ${effectiveFossilExpanded ? 'vtree-fossil-pill--expanded' : ''}`}
                    onClick={() => setLocalFossilExpanded(!effectiveFossilExpanded)}
                    title={
                      effectiveFossilExpanded
                        ? t('hierarchy.hide_fossils', 'Fosilleşmiş alt birimleri daralt')
                        : t('hierarchy.show_fossils', 'Fosilleşmiş alt birimleri göster')
                    }
                  >
                    <TRexSkullIcon className="badge-fossil-icon" />
                    <span>{totalPureFossils}</span>
                    {effectiveFossilExpanded ? (
                      <CircleMinus size={15} strokeWidth={2.2} />
                    ) : (
                      <CirclePlus size={15} strokeWidth={2.2} />
                    )}
                  </button>
                </div>

                {effectiveFossilExpanded && (
                  <div className="vtree-children-container">
                    <div className="vtree-stem-down" />
                    <div className="vtree-children-row">
                      {fossilTribes.map((tribe) => (
                        <TribeBranch
                          key={tribe.tribeId || tribe.id}
                          tribe={tribe}
                          parentActorId={`fossil-pill-${node.actorId}`}
                          t={t}
                        />
                      ))}

                      {pureFossilBots.map((child) => (
                        <div key={child.actorId} className="vtree-child-branch vtree-child-branch--fossil">
                          <div className="vtree-branch-line" />
                          <TreeNode
                            node={child}
                            parentId={`fossil-pill-${node.actorId}`}
                            setTreeData={setTreeData}
                            expandCounter={expandCounter}
                            fetchDepth={fetchDepth}
                            rootActorId={rootActorId}
                            showFossils={showFossils}
                            expandedAncestorIds={expandedAncestorIds}
                            onToggleAncestor={onToggleAncestor}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HierarchyTree({
  data,
  setTreeData,
  expandCounter,
  fetchDepth,
  rootActorId,
  zoomLevel = 0.82,
  onPulse,
  showFossils = false,
}) {
  useDevLog('HierarchyTree', arguments[0] || {})
  const treeContainerRef = useRef(null)
  const [expandedAncestorIds, setExpandedAncestorIds] = useState(() => new Set())
  // Fosil ata enjekte/daralt işlemlerinde overlay'in çizgileri deterministik
  // yeniden ölçmesi için yapısal değişim sayacı (MutationObserver'a güvenmeden).
  const [structureVersion, setStructureVersion] = useState(0)

  const handleToggleAncestor = useCallback((ancestorId) => {
    setExpandedAncestorIds((prev) => {
      const next = new Set(prev)
      if (next.has(ancestorId)) {
        next.delete(ancestorId)
      } else {
        next.add(ancestorId)
      }
      return next
    })
    setStructureVersion((v) => v + 1)
  }, [])

  if (!data) return null
  return (
    <div
      ref={treeContainerRef}
      className="hierarchy-tree-container"
      style={{ zoom: zoomLevel, '--tree-zoom': zoomLevel, paddingTop: 8, position: 'relative' }}
    >
      <HierarchyConnectionsOverlay
        containerRef={treeContainerRef}
        data={data}
        rootActorId={data?.actorId}
        expandCounter={expandCounter}
        structureVersion={structureVersion}
        onPulse={onPulse}
        pulseInterval={4000}
        speed={54}
        cardWidth={28}
      />
      <TreeNode
        node={data}
        setTreeData={setTreeData}
        expandCounter={expandCounter}
        fetchDepth={fetchDepth}
        rootActorId={rootActorId}
        showFossils={showFossils}
        expandedAncestorIds={expandedAncestorIds}
        onToggleAncestor={handleToggleAncestor}
      />
    </div>
  )
}
