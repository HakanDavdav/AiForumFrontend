import { useState, useEffect, useRef } from 'react'
import { CirclePlus, CircleMinus } from 'lucide-react'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import BotIcon from '../common/icons/BotIcon'
import { actorApi } from '../../api/actorApi'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import HierarchyConnectionsOverlay from './HierarchyConnectionsOverlay'

function TreeNode({ node, setTreeData, expandCounter, fetchDepth, rootActorId, parentId = null }) {
  const { t } = useTranslation()
  const [isExpanding, setIsExpanding] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (expandCounter > 0) {
      setIsCollapsed(false)
    }
  }, [expandCounter])

  const hasBots = Boolean(node.bots && node.bots.length > 0)
  const hasTribes = Boolean(node.tribes && node.tribes.length > 0)
  const hasChildren = hasBots || hasTribes

  // Eğer bu düğümün altına bakıldıysa ve bots & tribes boş geldiyse bunu kaydederiz
  const noMoreChildren = node._checked && !hasChildren
  const isRoot = node.actorId === rootActorId

  const handleToggle = async () => {
    if (hasChildren) {
      setIsCollapsed(!isCollapsed)
    } else {
      if (noMoreChildren || isExpanding) return

      setIsExpanding(true)
      try {
        const res = await actorApi.getChildHierarchy(node.actorId, fetchDepth)
        const newBots = res.data?.data?.bots || []
        const newTribes = res.data?.data?.tribes || []

        setTreeData((prevTree) => {
          const newTree = JSON.parse(JSON.stringify(prevTree))
          const updateNode = (currNode) => {
            if (currNode.actorId === node.actorId) {
              currNode.bots = newBots
              currNode.tribes = newTribes
              currNode._checked = true
              return true
            }
            if (currNode.bots) {
              for (let child of currNode.bots) {
                if (updateNode(child)) return true
              }
            }
            return false
          }
          updateNode(newTree)
          return newTree
        })

        if (newBots.length > 0 || newTribes.length > 0) {
          setIsCollapsed(false)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsExpanding(false)
      }
    }
  }

  return (
    <div className="vtree-node">
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
            {/* Bağlı Kabileler (Tribes) */}
            {hasTribes &&
              node.tribes.map((tribe) => (
                <div
                  key={tribe.tribeId || tribe.id}
                  className="vtree-child-branch vtree-child-branch--tribe"
                >
                  <div className="vtree-branch-line" />
                  <div className="vtree-node vtree-node--tribe">
                    <div
                      className="vtree-card-wrapper"
                      data-tribe-id={tribe.tribeId || tribe.id}
                      data-parent-id={node.actorId}
                    >
                      <div style={{ position: 'relative' }}>
                        <span
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
                            background: 'var(--color-primary)',
                            color: '#fff',
                            zIndex: 3,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            pointerEvents: 'none',
                          }}
                        >
                          {t('tribe.tribe', 'Klan')}
                        </span>
                        <TribeMinimalCard
                          tribeId={tribe.tribeId || tribe.id}
                          tribeName={tribe.tribeName || tribe.name}
                          tribePoint={tribe.tribeActorPoint ?? tribe.point}
                          imageUrl={tribe.imageUrl}
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
              ))}

            {/* Alt Botlar (Bots) */}
            {hasBots &&
              node.bots.map((child) => (
                <div key={child.actorId} className="vtree-child-branch">
                  <div className="vtree-branch-line" />
                  <TreeNode
                    node={child}
                    parentId={node.actorId}
                    setTreeData={setTreeData}
                    expandCounter={expandCounter}
                    fetchDepth={fetchDepth}
                    rootActorId={rootActorId}
                  />
                </div>
              ))}
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
}) {
  useDevLog('HierarchyTree', arguments[0] || {})
  const treeContainerRef = useRef(null)

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
        zoomLevel={zoomLevel}
        onPulse={onPulse}
        pulseInterval={2000}
        speed={54}
        cardWidth={28}
      />
      <TreeNode
        node={data}
        setTreeData={setTreeData}
        expandCounter={expandCounter}
        fetchDepth={fetchDepth}
        rootActorId={rootActorId}
      />
    </div>
  )
}
