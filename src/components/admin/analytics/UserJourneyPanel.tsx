/**
 * User Journey Panel
 *
 * Visualizes user flow between pages using a Sankey-style diagram
 * and shows top user paths through the application.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useUserJourneyAnalytics,
  type PageTransition,
  type JourneyNode,
} from "@/hooks/analytics/useUserJourneyAnalytics";
import { ArrowRight, TrendingUp, Users, MousePointerClick } from "@/lib/icons";
import { useMemo } from "react";

interface UserJourneyPanelProps {
  timePeriod: string;
}

export function UserJourneyPanel({ timePeriod }: UserJourneyPanelProps) {
  const { data, isLoading, error } = useUserJourneyAnalytics(timePeriod);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Не удалось загрузить данные о путях пользователей
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Summary Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Метрики навигации
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{data.avgSessionDepth.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Глубина сессии</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{data.bounceRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Bounce rate</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Топ страницы входа</p>
            <div className="space-y-1">
              {data.nodes.slice(0, 5).map((node) => (
                <div key={node.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{node.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {node.count.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top User Paths */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" />
            Популярные пути
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topPaths.slice(0, 6).map((pathData, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 flex-wrap text-sm min-w-0">
                  {pathData.path.map((page, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs truncate max-w-24">
                        {PAGE_LABELS[page] || page}
                      </Badge>
                      {i < pathData.path.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </span>
                  ))}
                </div>
                <Badge className="flex-shrink-0">{pathData.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flow Diagram */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Переходы между страницами
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SankeyDiagram nodes={data.nodes} links={data.links} />
        </CardContent>
      </Card>
    </div>
  );
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Главная",
  "/library": "Библиотека",
  "/generate": "Генерация",
  "/explore": "Обзор",
  "/profile": "Профиль",
  "/studio": "Студия",
  "/projects": "Проекты",
  "/settings": "Настройки",
  "/admin": "Админ",
  "/track": "Трек",
  "/playlist": "Плейлист",
  "/onboarding": "Онбординг",
};

interface SankeyDiagramProps {
  nodes: JourneyNode[];
  links: PageTransition[];
}

function SankeyDiagram({ nodes, links }: SankeyDiagramProps) {
  const { nodePositions, pathData, maxValue } = useMemo(() => {
    if (nodes.length === 0 || links.length === 0) {
      return { nodePositions: new Map(), pathData: [], maxValue: 0 };
    }

    // Simple two-column layout: sources on left, targets on right
    const sourceNodes = new Set<string>();
    const targetNodes = new Set<string>();

    links.forEach((link) => {
      sourceNodes.add(link.source);
      targetNodes.add(link.target);
    });

    // Nodes that are only sources go left, only targets go right
    // Nodes that are both go in the middle (we'll put them on left)
    const leftNodes = Array.from(sourceNodes);
    const rightNodes = Array.from(targetNodes).filter((n) => !sourceNodes.has(n));

    // Add remaining target nodes to left if they're also sources
    const allLeftNodes = [...new Set([...leftNodes])];
    const allRightNodes = [
      ...new Set([
        ...rightNodes,
        ...Array.from(targetNodes).filter((n) => !leftNodes.includes(n) || rightNodes.length === 0),
      ]),
    ];

    // If all nodes ended up on one side, split them
    const finalLeft =
      allLeftNodes.length > 0 ? allLeftNodes : nodes.slice(0, Math.ceil(nodes.length / 2)).map((n) => n.id);
    const finalRight =
      allRightNodes.length > 0 ? allRightNodes : nodes.slice(Math.ceil(nodes.length / 2)).map((n) => n.id);

    const positions = new Map<string, { x: number; y: number; height: number }>();
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Calculate max value for scaling
    const max = Math.max(...links.map((l) => l.value), 1);

    // Position left nodes
    let yOffset = 0;
    finalLeft.forEach((id) => {
      const node = nodeMap.get(id);
      const height = Math.max(20, Math.min(60, ((node?.count || 1) / max) * 50));
      positions.set(id, { x: 50, y: yOffset + 20, height });
      yOffset += height + 15;
    });

    // Position right nodes
    yOffset = 0;
    finalRight.forEach((id) => {
      const node = nodeMap.get(id);
      const height = Math.max(20, Math.min(60, ((node?.count || 1) / max) * 50));
      positions.set(id, { x: 350, y: yOffset + 20, height });
      yOffset += height + 15;
    });

    // Generate path data
    const paths = links
      .slice(0, 15)
      .map((link) => {
        const source = positions.get(link.source);
        const target = positions.get(link.target);

        if (!source || !target) return null;

        const sourceY = source.y + source.height / 2;
        const targetY = target.y + target.height / 2;

        return {
          path: `M ${source.x + 80} ${sourceY} C ${source.x + 150} ${sourceY}, ${target.x - 70} ${targetY}, ${target.x} ${targetY}`,
          value: link.value,
          source: link.source,
          target: link.target,
        };
      })
      .filter(Boolean);

    return { nodePositions: positions, pathData: paths, maxValue: max };
  }, [nodes, links]);

  if (nodes.length === 0 || links.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Недостаточно данных для визуализации
      </div>
    );
  }

  const height = Math.max(300, nodePositions.size * 40);

  return (
    <div className="overflow-x-auto">
      <svg width="100%" viewBox={`0 0 450 ${height}`} className="min-w-[400px]">
        {/* Links */}
        <g>
          {pathData.map(
            (p, i) =>
              p && (
                <path
                  key={i}
                  d={p.path}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={Math.max(2, Math.min(15, (p.value / maxValue) * 15))}
                  strokeOpacity={0.3}
                  className="transition-all hover:stroke-opacity-60"
                >
                  <title>{`${PAGE_LABELS[p.source] || p.source} → ${PAGE_LABELS[p.target] || p.target}: ${p.value}`}</title>
                </path>
              ),
          )}
        </g>

        {/* Nodes */}
        <g>
          {Array.from(nodePositions.entries()).map(([id, pos]) => {
            const node = nodes.find((n) => n.id === id);
            return (
              <g key={id}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={80}
                  height={pos.height}
                  rx={4}
                  fill="hsl(var(--primary))"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
                <text
                  x={pos.x + 40}
                  y={pos.y + pos.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-primary-foreground text-xs font-medium"
                >
                  {PAGE_LABELS[id] || id}
                </text>
                <text
                  x={pos.x + 40}
                  y={pos.y + pos.height + 12}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {node?.count.toLocaleString()}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
