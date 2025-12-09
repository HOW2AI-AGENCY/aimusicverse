import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronRight, Disc, Music, Tag, Folder, X, Search, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GraphData, GraphNode } from '@/hooks/useMusicGraph';

interface MobileGraphViewProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  selectedNode?: GraphNode | null;
  filter?: {
    genres?: string[];
    categories?: string[];
    nodeTypes?: ('genre' | 'style' | 'tag' | 'category')[];
  };
}

type ClusterType = 'genres' | 'categories' | null;
type DrillLevel = 'root' | 'cluster' | 'items';

const NODE_TYPE_ICONS = {
  genre: Disc,
  style: Music,
  tag: Tag,
  category: Folder,
};

const NODE_TYPE_LABELS = {
  genre: 'Жанры',
  style: 'Стили',
  tag: 'Теги',
  category: 'Категории',
};

export function MobileGraphView({ data, onNodeClick, selectedNode, filter }: MobileGraphViewProps) {
  const [drillLevel, setDrillLevel] = useState<DrillLevel>('root');
  const [selectedCluster, setSelectedCluster] = useState<ClusterType>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data
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

    return { nodes, edges: data.edges };
  }, [data, filter]);

  // Group nodes
  const groupedData = useMemo(() => {
    const genres: Record<string, GraphNode[]> = {};
    const categories: Record<string, GraphNode[]> = {};

    filteredData.nodes.forEach(node => {
      if (node.type === 'genre') {
        if (!genres[node.label]) genres[node.label] = [];
        genres[node.label].push(node);
      } else if (node.type === 'style' && node.genre) {
        if (!genres[node.genre]) genres[node.genre] = [];
        genres[node.genre].push(node);
      } else if (node.type === 'category' || node.type === 'tag') {
        const cat = node.category || 'Другое';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(node);
      }
    });

    return { genres, categories };
  }, [filteredData]);

  // Current items to show
  const currentItems = useMemo(() => {
    if (drillLevel === 'items' && selectedGroup) {
      const items = selectedCluster === 'genres' 
        ? groupedData.genres[selectedGroup] || []
        : groupedData.categories[selectedGroup] || [];
      
      if (searchQuery) {
        return items.filter(n => 
          n.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return items;
    }
    return [];
  }, [drillLevel, selectedGroup, selectedCluster, groupedData, searchQuery]);

  const handleBack = useCallback(() => {
    if (drillLevel === 'items') {
      setDrillLevel('cluster');
      setSelectedGroup(null);
      setSearchQuery('');
    } else if (drillLevel === 'cluster') {
      setDrillLevel('root');
      setSelectedCluster(null);
    }
  }, [drillLevel]);

  const handleClusterSelect = (cluster: ClusterType) => {
    setSelectedCluster(cluster);
    setDrillLevel('cluster');
  };

  const handleGroupSelect = (group: string) => {
    setSelectedGroup(group);
    setDrillLevel('items');
  };

  const handleSwipe = (info: PanInfo) => {
    if (info.offset.x > 100 && drillLevel !== 'root') {
      handleBack();
    }
  };

  // Root level - show main clusters
  const renderRoot = () => (
    <div className="grid grid-cols-2 gap-3 p-4">
      <ClusterCard
        icon={Disc}
        title="Жанры и Стили"
        count={Object.keys(groupedData.genres).length}
        color="hsl(var(--primary))"
        onClick={() => handleClusterSelect('genres')}
      />
      <ClusterCard
        icon={Tag}
        title="Теги"
        count={Object.keys(groupedData.categories).length}
        color="hsl(var(--accent))"
        onClick={() => handleClusterSelect('categories')}
      />
      
      {/* Quick stats */}
      <div className="col-span-2 p-4 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Статистика графа</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <StatItem 
            count={filteredData.nodes.filter(n => n.type === 'genre').length} 
            label="Жанров" 
          />
          <StatItem 
            count={filteredData.nodes.filter(n => n.type === 'style').length} 
            label="Стилей" 
          />
          <StatItem 
            count={filteredData.nodes.filter(n => n.type === 'tag').length} 
            label="Тегов" 
          />
          <StatItem 
            count={filteredData.edges.length} 
            label="Связей" 
          />
        </div>
      </div>
    </div>
  );

  // Cluster level - show groups within cluster
  const renderCluster = () => {
    const groups = selectedCluster === 'genres' 
      ? groupedData.genres 
      : groupedData.categories;
    
    return (
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {selectedCluster === 'genres' ? 'Жанры и Стили' : 'Категории тегов'}
          </h2>
        </div>
        
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2 pr-4">
            {Object.entries(groups)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([groupName, items]) => (
                <GroupCard
                  key={groupName}
                  name={groupName}
                  count={items.length}
                  color={items[0]?.color || 'hsl(var(--primary))'}
                  samples={items.slice(0, 3).map(n => n.label)}
                  onClick={() => handleGroupSelect(groupName)}
                />
              ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Items level - show individual nodes
  const renderItems = () => (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{selectedGroup}</h2>
          <p className="text-xs text-muted-foreground">{currentItems.length} элементов</p>
        </div>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <ScrollArea className="h-[calc(100vh-340px)]">
        <div className="space-y-2 pr-4">
          {currentItems.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onClick={() => onNodeClick?.(node)}
              relatedCount={data.edges.filter(
                e => e.source === node.id || e.target === node.id
              ).length}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <motion.div
      className="min-h-[500px] bg-background/50 rounded-xl border border-border overflow-hidden"
      onPanEnd={(_, info) => handleSwipe(info)}
    >
      <AnimatePresence mode="wait">
        {drillLevel === 'root' && (
          <motion.div
            key="root"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {renderRoot()}
          </motion.div>
        )}
        
        {drillLevel === 'cluster' && (
          <motion.div
            key="cluster"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderCluster()}
          </motion.div>
        )}
        
        {drillLevel === 'items' && (
          <motion.div
            key="items"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderItems()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Node Details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-20 left-0 right-0 z-50 p-4"
          >
            <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedNode.color + '20' }}
                  >
                    {(() => {
                      const Icon = NODE_TYPE_ICONS[selectedNode.type];
                      return <Icon className="w-5 h-5" style={{ color: selectedNode.color }} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedNode.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {NODE_TYPE_LABELS[selectedNode.type]}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onNodeClick?.(selectedNode)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {data.edges
                  .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                  .slice(0, 5)
                  .map(edge => {
                    const relatedId = edge.source === selectedNode.id ? edge.target : edge.source;
                    const related = data.nodes.find(n => n.id === relatedId);
                    if (!related) return null;
                    return (
                      <Badge 
                        key={related.id} 
                        variant="outline"
                        className="text-xs cursor-pointer"
                        onClick={() => onNodeClick?.(related)}
                      >
                        {related.label}
                      </Badge>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Sub-components
function ClusterCard({ 
  icon: Icon, 
  title, 
  count, 
  color, 
  onClick 
}: { 
  icon: typeof Disc; 
  title: string; 
  count: number; 
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 rounded-xl bg-card border border-border text-left active:bg-muted/50 transition-colors"
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{count} групп</p>
      <ChevronRight className="w-4 h-4 text-muted-foreground mt-2" />
    </motion.button>
  );
}

function StatItem({ count, label }: { count: number; label: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-primary">{count}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function GroupCard({ 
  name, 
  count, 
  color, 
  samples, 
  onClick 
}: { 
  name: string; 
  count: number; 
  color: string;
  samples: string[];
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-card border border-border text-left active:bg-muted/50 transition-colors flex items-center gap-3"
    >
      <div 
        className="w-10 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm truncate">{name.replace(/_/g, ' ')}</h3>
          <Badge variant="secondary" className="ml-2 text-[10px]">{count}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {samples.join(', ')}...
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );
}

function NodeCard({ 
  node, 
  isSelected, 
  onClick,
  relatedCount
}: { 
  node: GraphNode; 
  isSelected: boolean;
  onClick: () => void;
  relatedCount: number;
}) {
  const Icon = NODE_TYPE_ICONS[node.type];
  
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-xl border text-left active:bg-muted/50 transition-colors flex items-center gap-3",
        isSelected 
          ? "bg-primary/10 border-primary" 
          : "bg-card border-border"
      )}
    >
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: node.color + '20' }}
      >
        <Icon className="w-4 h-4" style={{ color: node.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{node.label}</h3>
        <p className="text-xs text-muted-foreground">
          {relatedCount} связей
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );
}
