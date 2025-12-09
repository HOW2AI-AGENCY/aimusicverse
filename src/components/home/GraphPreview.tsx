import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network, Sparkles, ChevronRight, Tag, Music2, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMusicGraphData, GraphNode } from '@/hooks/useMusicGraph';

export function GraphPreview() {
  const navigate = useNavigate();
  const { graphData, isLoading } = useMusicGraphData();

  const stats = graphData ? {
    genres: graphData.nodes.filter((n: GraphNode) => n.type === 'genre').length,
    styles: graphData.nodes.filter((n: GraphNode) => n.type === 'style').length,
    tags: graphData.nodes.filter((n: GraphNode) => n.type === 'tag').length,
    connections: graphData.edges.length
  } : null;

  return (
    <section className="mb-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate('/music-graph')}
        className="cursor-pointer"
      >
        <div className="relative p-4 rounded-xl bg-gradient-to-br from-primary/10 via-card/80 to-card/50 border border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden group">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 200 100">
              <circle cx="30" cy="30" r="8" fill="currentColor" className="text-primary animate-pulse" />
              <circle cx="80" cy="50" r="6" fill="currentColor" className="text-cyan-500" />
              <circle cx="120" cy="25" r="7" fill="currentColor" className="text-pink-500" />
              <circle cx="160" cy="60" r="5" fill="currentColor" className="text-yellow-500" />
              <circle cx="50" cy="70" r="6" fill="currentColor" className="text-green-500" />
              <line x1="30" y1="30" x2="80" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
              <line x1="80" y1="50" x2="120" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
              <line x1="120" y1="25" x2="160" y2="60" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
              <line x1="80" y1="50" x2="50" y2="70" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Network className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Граф музыки</h3>
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Новое
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">База знаний жанров и стилей</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>

            {/* Stats */}
            {stats && !isLoading && (
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                  <Music2 className="w-4 h-4 text-purple-500 mb-1" />
                  <span className="text-lg font-bold">{stats.genres}</span>
                  <span className="text-[10px] text-muted-foreground">Жанры</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                  <Layers className="w-4 h-4 text-cyan-500 mb-1" />
                  <span className="text-lg font-bold">{stats.styles}</span>
                  <span className="text-[10px] text-muted-foreground">Стили</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                  <Tag className="w-4 h-4 text-pink-500 mb-1" />
                  <span className="text-lg font-bold">{stats.tags}</span>
                  <span className="text-[10px] text-muted-foreground">Теги</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                  <Network className="w-4 h-4 text-yellow-500 mb-1" />
                  <span className="text-lg font-bold">{stats.connections}</span>
                  <span className="text-[10px] text-muted-foreground">Связи</span>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="h-16 flex items-center justify-center">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div 
                      key={i} 
                      className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
