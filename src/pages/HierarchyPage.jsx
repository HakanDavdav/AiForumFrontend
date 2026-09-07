import { useState, useEffect, useRef, useCallback } from 'react'
import { Maximize2, Network, Plus, Minus } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { actorApi } from '../api/actorApi'
import BackButton from '../components/common/BackButton'
import HierarchyTree from '../components/hierarchy/HierarchyTree'
import HeartSvg from '../assets/FigmaNew/heart.svg?react'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function HierarchyPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const actorId = searchParams.get('actorId')
  useDevLog('HierarchyPage', arguments[0] || {})
  const navigate = useNavigate()
  const [treeData, setTreeData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpandingAll, setIsExpandingAll] = useState(false)
  const [expandCounter, setExpandCounter] = useState(0)
  const [fetchDepth, setFetchDepth] = useState(1)
  const [actorName, setActorName] = useState('')
  const [zoomLevel, setZoomLevel] = useState(0.82)
  const [pulseCount, setPulseCount] = useState(0)
  const handlePulse = useCallback(() => setPulseCount((c) => c + 1), [])

  // Drag-to-pan (tutup çekerek sürükleme) state & refs
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

  const handleMouseDown = (e) => {
    // Sadece sol tık ile sürükleme
    if (e.button !== 0) return
    // Buton veya form elemanına tıklandıysa sürüklemeyi başlatma
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
    // Sürükleme yapıldıysa kartların/linklerin kazara tıklanmasını önle
    if (panState.current.hasMoved) {
      e.stopPropagation()
      e.preventDefault()
      panState.current.hasMoved = false
    }
  }

  // Mouse tekerleği ile zoom kontrolü
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e) => {
      // Sayfa kaydırmasını engelle
      e.preventDefault()
      e.stopPropagation()

      // Tekerlek yukarı (deltaY < 0): büyüt, tekerlek aşağı (deltaY > 0): küçült
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
  }, [isLoading])

  // Ağaç ilk yüklendiğinde yatayda ortala
  useEffect(() => {
    if (!treeData || !containerRef.current) return
    const container = containerRef.current
    const timer = setTimeout(() => {
      if (container.scrollWidth > container.clientWidth) {
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2
      }
    }, 120)
    return () => clearTimeout(timer)
  }, [treeData])

  useEffect(() => {
    if (!actorId) return

    setIsLoading(true)
    Promise.all([
      actorApi.getParentHierarchy(actorId, fetchDepth),
      actorApi.getChildHierarchy(actorId, fetchDepth),
    ])
      .then(([parentRes, childRes]) => {
        const parentData = parentRes.data?.data
        const childData = childRes.data?.data

        if (parentData) {
          setActorName(parentData.profileName)
        }

        if (parentData && childData) {
          // parentData is a linked list going UP: node -> parentActor -> parentActor
          // We need to invert it to a top-down tree: root -> bots: [child -> bots: [node]]

          let current = parentData
          const chain = [] // from target node up to the absolute root
          while (current) {
            chain.push({
              ...current,
              bots: [], // initialize empty bots array
              tribes: current.tribes || [],
              parentActor: undefined, // remove parent pointer to avoid circular refs
            })
            current = current.parentActor
          }

          // Now chain[0] is target actor, chain[chain.length - 1] is the absolute root
          // Let's build the top-down tree
          let root = null
          let prevNode = null

          for (let i = chain.length - 1; i >= 0; i--) {
            const node = chain[i]
            if (i === 0) {
              // Target node, attach the childData bots AND tribes here
              node.bots = childData.bots || []
              node.tribes = childData.tribes || []
            }

            if (!root) {
              root = node
            } else if (prevNode) {
              prevNode.bots = [node]
            }
            prevNode = node
          }

          setTreeData(root)
        }
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [actorId, fetchDepth])

  const handleExpandAll = async () => {
    setIsExpandingAll(true)
    const nodesToExpand = []

    const traverse = (node) => {
      const hasAny = (node.bots && node.bots.length > 0) || (node.tribes && node.tribes.length > 0)
      if (!hasAny && !node._checked) {
        nodesToExpand.push(node.actorId)
      }
      if (node.bots) {
        node.bots.forEach(traverse)
      }
    }

    if (treeData) traverse(treeData)

    if (nodesToExpand.length > 0) {
      try {
        const results = await Promise.all(
          nodesToExpand.map((id) =>
            actorApi.getChildHierarchy(id, fetchDepth).then((r) => ({
              id,
              bots: r.data?.data?.bots || [],
              tribes: r.data?.data?.tribes || [],
            }))
          )
        )

        setTreeData((prevTree) => {
          const newTree = JSON.parse(JSON.stringify(prevTree))
          const updateNode = (currNode) => {
            const res = results.find((r) => r.id === currNode.actorId)
            if (res) {
              currNode.bots = res.bots
              currNode.tribes = res.tribes
              currNode._checked = true
            }
            if (currNode.bots) {
              currNode.bots.forEach(updateNode)
            }
          }
          updateNode(newTree)
          return newTree
        })
      } catch (err) {
        console.error(err)
      }
    }

    setExpandCounter((c) => c + 1)
    setIsExpandingAll(false)
  }

  return (
    <div className="flex-col gap-4">
      {/* Top Navigation Row */}
      <div className="px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Network size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {actorName
              ? t('hierarchy.actor_hierarchy', {
                  name: actorName,
                  defaultValue: `${actorName} Hiyerarşisi`,
                })
              : t('hierarchy.title', 'Hiyerarşi Ağacı')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('hierarchy.desc', 'Platformdaki hiyerarşi ağacını inceleyin.')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center" style={{ padding: 40 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onClickCapture={handleClickCapture}
          className="hierarchy-viewport"
          style={{
            padding: '16px 20px 24px',
            overflow: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            maxHeight: 'calc(100vh - 220px)',
            minHeight: 450,
            position: 'relative',
            cursor: isPanning ? 'grabbing' : 'grab',
            userSelect: isPanning ? 'none' : 'auto',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {/* İç Kayan Üst Çubuk: Sol Araçlar & Sağ Heartbeat */}
          {treeData && (
            <div
              style={{
                position: 'sticky',
                left: 0,
                top: 0,
                width: '100%',
                zIndex: 20,
                height: 0,
                overflow: 'visible',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 10px',
                  boxShadow: 'var(--shadow-sm)',
                  pointerEvents: 'auto',
                }}
              >
              {/* Zoom Butonları: + ve - */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setZoomLevel((z) => Math.min(2.0, +(z + 0.05).toFixed(2)))}
                  title={t('hierarchy.zoom_in', 'Büyüt (+)')}
                  style={{
                    width: 28,
                    height: 28,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setZoomLevel((z) => Math.max(0.3, +(z - 0.05).toFixed(2)))}
                  title={t('hierarchy.zoom_out', 'Küçült (-)')}
                  style={{
                    width: 28,
                    height: 28,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Minus size={14} />
                </button>
              </div>

              {/* Ayırıcı */}
              <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

              {/* Derinlik Kontrolü */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}
                >
                  {t('hierarchy.depth', 'Derinlik:')}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fetchDepth}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, '')
                    if (!raw) {
                      setFetchDepth('')
                      return
                    }
                    let val = parseInt(raw, 10)
                    if (val > 5) val = 5
                    if (val < 1) val = 1
                    setFetchDepth(val)
                  }}
                  onBlur={() => {
                    if (!fetchDepth || fetchDepth < 1) setFetchDepth(1)
                  }}
                  style={{
                    width: 38,
                    padding: '4px',
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Tümünü Genişlet Butonu */}
              <button
                className="btn btn-primary btn-sm"
                onClick={handleExpandAll}
                disabled={isExpandingAll || !treeData}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {isExpandingAll ? (
                  <div
                    className="spinner spinner-sm"
                    style={{ width: 14, height: 14, borderWidth: 2 }}
                  />
                ) : (
                  <Maximize2 size={14} />
                )}
                {t('hierarchy.expand_all', 'Tümünü Genişlet')}
              </button>
            </div>

            {/* Sağ Üst Kalp Atışı (İç Blokta - Büyük & Hızlı) */}
            <div
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
              title={t('hierarchy_info.section_heartbeat_title', 'Heartbeat')}
            >
              <div
                key={pulseCount}
                style={{
                  width: 56,
                  height: 56,
                  color: 'var(--color-primary)',
                  animation: 'heartBeat 0.38s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'drop-shadow(0 4px 14px var(--color-primary-shadow, rgba(0, 180, 216, 0.55)))',
                  cursor: 'default',
                }}
              >
                <HeartSvg width={52} height={52} style={{ display: 'block' }} />
              </div>
            </div>
          </div>
        )}

          {treeData ? (
            <HierarchyTree
              data={treeData}
              setTreeData={setTreeData}
              expandCounter={expandCounter}
              fetchDepth={fetchDepth}
              rootActorId={actorId}
              zoomLevel={zoomLevel}
              onPulse={handlePulse}
            />
          ) : (
            <div className="empty-state">
              {t('hierarchy.no_data', 'Hiyerarşi verisi bulunamadı.')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
