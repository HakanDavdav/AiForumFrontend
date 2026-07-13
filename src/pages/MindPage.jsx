import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ForceGraph3D from 'react-force-graph-3d';
import { actorApi } from '../api/actorApi';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MindPage() {
  const [searchParams] = useSearchParams();
  const actorId = searchParams.get('actorId');
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!actorId) {
      toast.error('Actor ID is missing.');
      navigate('/');
      return;
    }

    const fetchMemory = async () => {
      setIsLoading(true);
      try {
        const response = await actorApi.getFullMemory(actorId);
        if (response.data.succeeded) {
          if (response.data.data) {
            try {
               const parsedData = JSON.parse(response.data.data);
               setRawData(parsedData);
            } catch (e) {
               console.error("Failed to parse neo4j output:", e);
               toast.error('Failed to parse memory data.');
               setRawData([]);
            }
          } else {
             setRawData([]);
          }
        } else {
          toast.error(response.data.errors?.[0]?.description || 'Failed to fetch memory.');
        }
      } catch (error) {
        console.error(error);
        toast.error('An error occurred while fetching memory.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemory();
  }, [actorId, navigate]);

  const graphData = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return { nodes: [], links: [] };

    const nodesMap = new Map();
    const linksSet = new Set();
    const linksArr = [];

    rawData.forEach(path => {
      const pathNodes = path.Nodes || [];
      const pathRels = path.Relationships || [];

      // Add nodes
      pathNodes.forEach(n => {
        const nodeId = n.id || n.name || JSON.stringify(n);
        if (!nodesMap.has(nodeId)) {
          const isPersona = n.label === 'Persona';
          nodesMap.set(nodeId, {
            id: nodeId,
            name: n.name || nodeId,
            label: n.label,
            val: isPersona ? 30 : 10,
            color: isPersona ? '#ff4b4b' : (n.label === 'Topic' ? '#4bafff' : '#b24bff')
          });
        }
      });

      // Construct links
      for (let i = 0; i < pathRels.length; i++) {
        if (i + 1 < pathNodes.length) {
           const sourceId = pathNodes[i].id || pathNodes[i].name || JSON.stringify(pathNodes[i]);
           const targetId = pathNodes[i + 1].id || pathNodes[i + 1].name || JSON.stringify(pathNodes[i + 1]);
           const relType = pathRels[i];
           
           const linkKey = `${sourceId}-${relType}-${targetId}`;
           if (!linksSet.has(linkKey)) {
             linksSet.add(linkKey);
             linksArr.push({
               source: sourceId,
               target: targetId,
               name: relType
             });
           }
        }
      }
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links: linksArr
    };
  }, [rawData]);

  const handleNodeClick = useCallback(node => {
    // Focus camera on node
    const distance = 300;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    if (fgRef.current) {
        fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        2000
        );
    }
  }, [fgRef]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-lg overflow-hidden border border-slate-800/50 shadow-xl relative w-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 z-10 absolute top-0 left-0 right-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-700 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Mind Graph</h1>
          <p className="text-sm text-slate-400">Semantic memory visualization</p>
        </div>
      </div>

      {/* Graph Area */}
      <div ref={containerRef} className="flex-1 w-full h-full relative bg-[#020617] pt-[72px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : graphData.nodes.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center pt-[72px]">
            <p className="text-slate-500">No memory found for this persona.</p>
          </div>
        ) : (
          dimensions.width > 0 && dimensions.height > 0 && (
            <ForceGraph3D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height - 72}
              graphData={graphData}
              nodeLabel={node => `${node.label}: ${node.name}`}
              nodeColor="color"
              nodeRelSize={6}
              nodeVal="val"
              linkColor={() => 'rgba(255,255,255,0.2)'}
              linkWidth={1.5}
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              backgroundColor="#020617"
              nodeOpacity={0.9}
            />
          )
        )}
      </div>
    </div>
  );
}
