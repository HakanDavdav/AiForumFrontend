import { useState, useEffect } from 'react'
import { ArrowLeft, Maximize2, Network } from 'lucide-react'
import { actorApi } from '../api/actorApi'
import useUIStore from '../store/uiStore'
import HierarchyTree from '../components/hierarchy/HierarchyTree'
import useDevLog from '../utils/useDevLog'

export default function HierarchyPage({ actorId }) {
  useDevLog('HierarchyPage', arguments[0] || {})
  const { goBack } = useUIStore()
  const [treeData, setTreeData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpandingAll, setIsExpandingAll] = useState(false)
  const [expandCounter, setExpandCounter] = useState(0)
  const [fetchDepth, setFetchDepth] = useState(1)
  const [actorName, setActorName] = useState('')

  useEffect(() => {
    if (!actorId) return

    setIsLoading(true)
    Promise.all([
      actorApi.getParentHierarchy(actorId),
      actorApi.getChildHierarchy(actorId, fetchDepth)
    ]).then(([parentRes, childRes]) => {
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
            parentActor: undefined // remove parent pointer to avoid circular refs
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
            // Target node, attach the childData bots here
            node.bots = childData.bots || []
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
    }).catch(err => {
      console.error(err)
    }).finally(() => {
      setIsLoading(false)
    })
  }, [actorId])

  const handleExpandAll = async () => {
    setIsExpandingAll(true)
    const nodesToExpand = []
    
    const traverse = (node) => {
      if ((!node.bots || node.bots.length === 0) && !node._checked) {
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
          nodesToExpand.map(id => actorApi.getChildHierarchy(id, fetchDepth).then(r => ({ id, bots: r.data?.data?.bots || [] })))
        )
        
        setTreeData(prevTree => {
          const newTree = JSON.parse(JSON.stringify(prevTree))
          const updateNode = (currNode) => {
            const res = results.find(r => r.id === currNode.actorId)
            if (res) {
              currNode.bots = res.bots
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
    
    setExpandCounter(c => c + 1)
    setIsExpandingAll(false)
  }

  return (
    <div className="flex-col gap-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={goBack} title="Geri Dön">
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ 
            fontSize: 26, 
            fontWeight: 900, 
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            margin: 0,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Network size={26} color="var(--color-primary)" style={{ WebkitTextFillColor: 'initial' }} />
            {actorName ? `${actorName} TREE` : 'HİYERARŞİ'}
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Derinlik:</span>
            <input 
              type="number" 
              min="1" 
              max="5" 
              value={fetchDepth} 
              onChange={e => {
                let val = parseInt(e.target.value) || 1
                if (val > 5) val = 5
                if (val < 1) val = 1
                setFetchDepth(val)
              }}
              style={{ width: 48, padding: '4px', borderRadius: 6, border: '1px solid var(--color-border)', textAlign: 'center', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleExpandAll}
            disabled={isExpandingAll || !treeData}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isExpandingAll ? <div className="spinner spinner-sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Maximize2 size={14} />}
            Tümünü Genişlet
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
      ) : (
        <div className="card-surface" style={{ padding: 24, overflowX: 'auto', minHeight: 400 }}>
          {treeData ? (
             <HierarchyTree data={treeData} setTreeData={setTreeData} expandCounter={expandCounter} fetchDepth={fetchDepth} rootActorId={actorId} />
          ) : (
             <div className="empty-state">Hiyerarşi verisi bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  )
}
