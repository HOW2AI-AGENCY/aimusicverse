import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Music, Tag, Folder, Disc, Search, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ForceGraph } from '@/components/music-graph/ForceGraph';
import { MobileGraphView } from '@/components/music-graph/MobileGraphView';
import { NodeDetails } from '@/components/music-graph/NodeDetails';
import { GraphFilters } from '@/components/music-graph/GraphFilters';
import { useMusicGraphData, type GraphNode } from '@/hooks/useMusicGraph';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MusicGraph() {
  const isMobile = useIsMobile();
  const { graphData, isLoading, tags, styles } = useMusicGraphData();
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<('genre' | 'style' | 'tag' | 'category')[]>(['genre', 'style', 'tag', 'category']);
  const [activeTab, setActiveTab] = useState<'graph' | 'list'>('graph');

  // Get unique genres and categories
  const genres = useMemo(() => 
    [...new Set((styles || []).map(s => s.primary_genre).filter((g): g is string => !!g))],
    [styles]
  );

  const categories = useMemo(() => 
    [...new Set((tags || []).map(t => t.category))],
    [tags]
  );

  // Filter for graph
  const graphFilter = useMemo(() => ({
    genres: selectedGenres.length > 0 ? selectedGenres : undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    nodeTypes: selectedNodeTypes,
  }), [selectedGenres, selectedCategories, selectedNodeTypes]);

  // Get related nodes for selected node
  const relatedNodes = useMemo(() => {
    if (!selectedNode) return [];
    
    const connectedIds = new Set<string>();
    graphData.edges.forEach(edge => {
      if (edge.source === selectedNode.id) connectedIds.add(edge.target);
      if (edge.target === selectedNode.id) connectedIds.add(edge.source);
    });
    
    return graphData.nodes.filter(n => connectedIds.has(n.id));
  }, [selectedNode, graphData]);

  // Filtered list for list view
  const filteredItems = useMemo(() => {
    let items = graphData.nodes;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(n => n.label.toLowerCase().includes(query));
    }
    
    return items;
  }, [graphData.nodes, searchQuery]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  };

  const resetFilters = () => {
    setSelectedGenres([]);
    setSelectedCategories([]);
    setSelectedNodeTypes(['genre', 'style', 'tag', 'category']);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Network className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Граф музыкальных связей</h1>
              <p className="text-sm text-muted-foreground">
                {graphData.nodes.length} элементов · {graphData.edges.length} связей
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Disc className="w-3 h-3" /> Жанры
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Music className="w-3 h-3" /> Стили
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Tag className="w-3 h-3" /> Теги
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Folder className="w-3 h-3" /> Категории
            </Badge>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'graph' | 'list')}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="graph" className="gap-2">
                <Network className="w-4 h-4" />
                Граф
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <Tag className="w-4 h-4" />
                Список
              </TabsTrigger>
            </TabsList>

            {activeTab === 'list' && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="mb-4">
            <GraphFilters
              genres={genres}
              categories={categories}
              selectedGenres={selectedGenres}
              selectedCategories={selectedCategories}
              selectedNodeTypes={selectedNodeTypes}
              onGenresChange={setSelectedGenres}
              onCategoriesChange={setSelectedCategories}
              onNodeTypesChange={setSelectedNodeTypes}
              onReset={resetFilters}
            />
          </div>

          {/* Graph View */}
          <TabsContent value="graph" className="mt-0">
            {isMobile ? (
              <MobileGraphView
                data={graphData}
                onNodeClick={handleNodeClick}
                selectedNode={selectedNode}
                filter={graphFilter}
              />
            ) : (
              <div className="relative h-[600px]">
                <ForceGraph
                  data={graphData}
                  onNodeClick={handleNodeClick}
                  selectedNode={selectedNode}
                  filter={graphFilter}
                />

                {/* Node Details Panel */}
                <AnimatePresence>
                  {selectedNode && (
                    <NodeDetails
                      node={selectedNode}
                      onClose={() => setSelectedNode(null)}
                      relatedNodes={relatedNodes}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tags by Category */}
              {categories.map(category => {
                const categoryTags = filteredItems.filter(n => 
                  n.type === 'tag' && n.category === category
                );
                
                if (categoryTags.length === 0) return null;
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-primary" />
                      {category.replace(/_/g, ' ')}
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {categoryTags.length}
                      </Badge>
                    </h3>
                    <ScrollArea className="h-48">
                      <div className="flex flex-wrap gap-1">
                        {categoryTags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                            style={{ borderColor: tag.color + '50' }}
                            onClick={() => handleNodeClick(tag)}
                          >
                            {tag.label}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                );
              })}

              {/* Styles by Genre */}
              {genres.map(genre => {
                const genreStyles = filteredItems.filter(n => 
                  n.type === 'style' && n.genre === genre
                );
                
                if (genreStyles.length === 0) return null;
                
                return (
                  <motion.div
                    key={genre}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Disc className="w-4 h-4 text-primary" />
                      {genre}
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {genreStyles.length}
                      </Badge>
                    </h3>
                    <ScrollArea className="h-48">
                      <div className="space-y-1">
                        {genreStyles.map(style => (
                          <div
                            key={style.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleNodeClick(style)}
                          >
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: style.color }}
                            />
                            <span className="text-sm">{style.label}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Как использовать граф</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Перетаскивайте для навигации, используйте колесо мыши для масштабирования</li>
                <li>• Кликните на узел для просмотра деталей и связанных элементов</li>
                <li>• Используйте фильтры для отображения только нужных категорий</li>
                <li>• Копируйте теги и стили для использования в генерации музыки</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
