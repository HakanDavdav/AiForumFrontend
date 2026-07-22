import { useState, useEffect } from 'react'
import { CirclePlus, CircleMinus } from 'lucide-react'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import { actorApi } from '../../api/actorApi'
import useDevLog from '../../utils/useDevLog'

function TreeNode({ node, setTreeData, expandCounter, fetchDepth, rootActorId }) {
  const [isExpanding, setIsExpanding] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  useEffect(() => {
    if (expandCounter > 0) {
      setIsCollapsed(false)
    }
  }, [expandCounter])

  const hasChildren = node.bots && node.bots.length > 0

  // Eğer bu düğümün altına bakıldıysa ve bots boş geldiyse bunu kaydederiz
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
        
        if (newBots.length === 0) {
          setTreeData(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree))
            const updateNode = (currNode) => {
              if (currNode.actorId === node.actorId) {
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
        } else {
          // Tüm ağacı güncelliyoruz
          setTreeData(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree))
            
            const updateNode = (currNode) => {
              if (currNode.actorId === node.actorId) {
                currNode.bots = newBots
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
    <div className="tree-node">
      <div className="tree-node-content" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
        <ActorMinimalCard 
          actor={node} 
          showHierarchyBtn={true} 
          clickable={true} 
          variant="expanded"
          chipStyle={isRoot ? {
            background: 'var(--color-primary-light)',
            borderColor: 'var(--color-primary-dark)',
            boxShadow: '0 4px 12px var(--color-primary-shadow)'
          } : {
            background: 'var(--color-bg)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        />
        
        {!noMoreChildren && (
          <button 
            onClick={handleToggle}
            disabled={isExpanding}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 0,
              paddingRight: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
            title={hasChildren ? (isCollapsed ? "Genişlet" : "Daralt") : "Alt botları yükle"}
          >
            {isExpanding ? (
              <div className="spinner spinner-sm" style={{ width: 16, height: 16, borderWidth: 2.4 }} />
            ) : (
              hasChildren && !isCollapsed ? <CircleMinus size={19} strokeWidth={2.4} /> : <CirclePlus size={19} strokeWidth={2.4} />
            )}
          </button>
        )}
      </div>

      {hasChildren && !isCollapsed && (
        <div className="tree-children">
          {node.bots.map(child => (
            <TreeNode key={child.actorId} node={child} setTreeData={setTreeData} expandCounter={expandCounter} fetchDepth={fetchDepth} rootActorId={rootActorId} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HierarchyTree({ data, setTreeData, expandCounter, fetchDepth, rootActorId }) {
  useDevLog('HierarchyTree', arguments[0] || {})
  if (!data) return null
  return (
    <div className="hierarchy-tree-container">
      <TreeNode node={data} setTreeData={setTreeData} expandCounter={expandCounter} fetchDepth={fetchDepth} rootActorId={rootActorId} />
    </div>
  )
}
