import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GraphData, GraphNode } from '@/hooks/useMusicGraph';

interface ForceGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  selectedNode?: GraphNode | null;
  filter?: {
    genres?: string[];
    categories?: string[];
    nodeTypes?: ('genre' | 'style' | 'tag' | 'category')[];
  };
}

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function ForceGraph({ data, onNodeClick, selectedNode, filter }: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const positionsRef = useRef<Map<string, NodePosition>>(new Map<string, NodePosition>());
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Filter nodes and edges
  const filteredData = useMemo(() => {
    if (!filter) return data;

    let nodes = data.nodes;
    
    if (filter.nodeTypes && filter.nodeTypes.length > 0) {
      nodes = nodes.filter(n => filter.nodeTypes!.includes(n.type));
    }
    
    if (filter.genres && filter.genres.length > 0) {
      nodes = nodes.filter(n => 
        n.type === 'genre' ? filter.genres!.includes(n.label) :
        n.type === 'style' ? filter.genres!.includes(n.genre || '') :
        true
      );
    }
    
    if (filter.categories && filter.categories.length > 0) {
      nodes = nodes.filter(n => 
        n.type === 'category' ? filter.categories!.includes(n.category || '') :
        n.type === 'tag' ? filter.categories!.includes(n.category || '') :
        true
      );
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = data.edges.filter(e => 
      nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    return { nodes, edges };
  }, [data, filter]);

  // Initialize positions
  useEffect(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    filteredData.nodes.forEach(node => {
      if (!positionsRef.current.has(node.id)) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 100 + Math.random() * 200;
        positionsRef.current.set(node.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        });
      }
    });
  }, [filteredData, dimensions]);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { nodes, edges } = filteredData;
    const positions = positionsRef.current;

    const animate = () => {
      // Physics
      nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;

        pos.vx += (dimensions.width / 2 - pos.x) * 0.001;
        pos.vy += (dimensions.height / 2 - pos.y) * 0.001;

        nodes.forEach(other => {
          if (node.id === other.id) return;
          const otherPos = positions.get(other.id);
          if (!otherPos) return;
          const dx = pos.x - otherPos.x;
          const dy = pos.y - otherPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 100) {
            pos.vx += (dx / dist) * 0.5;
            pos.vy += (dy / dist) * 0.5;
          }
        });

        pos.vx *= 0.9;
        pos.vy *= 0.9;
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.x = Math.max(50, Math.min(dimensions.width - 50, pos.x));
        pos.y = Math.max(50, Math.min(dimensions.height - 50, pos.y));
      });

      // Render
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      edges.forEach(edge => {
        const s = positions.get(edge.source);
        const t = positions.get(edge.target);
        if (!s || !t) return;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = 'rgba(100,100,100,0.2)';
        ctx.stroke();
      });

      nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        if (zoom > 0.5) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, pos.x, pos.y + node.size + 12);
        }
      });

      ctx.restore();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [filteredData, zoom, pan, dimensions]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleClick = () => {
    if (hoveredNode && onNodeClick) onNodeClick(hoveredNode);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] bg-background/50 rounded-xl overflow-hidden border border-border/50">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className={cn("cursor-grab", isDragging && "cursor-grabbing")}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onClick={handleClick}
        onWheel={(e) => { e.preventDefault(); setZoom(z => Math.max(0.2, Math.min(3, z * (e.deltaY > 0 ? 0.9 : 1.1)))); }}
      />
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.min(3, z * 1.2))}><ZoomIn className="w-4 h-4" /></Button>
        <Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.max(0.2, z * 0.8))}><ZoomOut className="w-4 h-4" /></Button>
        <Button size="icon" variant="secondary" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><RotateCcw className="w-4 h-4" /></Button>
      </div>
      <div className="absolute top-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {filteredData.nodes.length} узлов · {filteredData.edges.length} связей
      </div>
    </div>
  );
}
