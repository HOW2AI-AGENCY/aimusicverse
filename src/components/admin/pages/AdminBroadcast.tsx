/**
 * Admin Broadcast Page
 * 
 * Mass notification management with:
 * - Broadcast composer
 * - Template management
 * - Delivery analytics
 * - Scheduled broadcasts
 * 
 * TODO: Add segment targeting (by tier, by activity)
 * TODO: Add A/B testing for broadcasts
 * TODO: Add rich media support (images, buttons)
 * 
 * @author MusicVerse AI
 * @version 1.0.0
 */

import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Send, 
  MessageSquare,
  Users,
  Clock,
} from 'lucide-react';

// Lazy load heavy component
const BroadcastPanel = lazy(() => 
  import('../BroadcastPanel').then(m => ({ default: m.BroadcastPanel }))
);

// ============================================================
// Quick Stats (placeholder)
// ============================================================
const BroadcastStats = () => (
  <div className="grid grid-cols-3 gap-4 mb-6">
    <Card>
      <CardContent className="p-4 text-center">
        <MessageSquare className="h-6 w-6 mx-auto text-primary mb-2" />
        <p className="text-2xl font-bold">—</p>
        <p className="text-xs text-muted-foreground">Отправлено сегодня</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <Users className="h-6 w-6 mx-auto text-green-500 mb-2" />
        <p className="text-2xl font-bold">—</p>
        <p className="text-xs text-muted-foreground">Доставлено</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
        <p className="text-2xl font-bold">—</p>
        <p className="text-xs text-muted-foreground">Запланировано</p>
      </CardContent>
    </Card>
  </div>
);

// ============================================================
// Loading Skeleton
// ============================================================
const BroadcastSkeleton = () => (
  <Card>
    <CardContent className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-32" />
    </CardContent>
  </Card>
);

// ============================================================
// Main Component
// ============================================================
export function AdminBroadcast() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Send className="h-6 w-6" />
          Рассылки
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Массовые уведомления пользователям
        </p>
      </div>

      {/* Quick Stats */}
      <BroadcastStats />

      {/* Broadcast Panel */}
      <Suspense fallback={<BroadcastSkeleton />}>
        <BroadcastPanel />
      </Suspense>

      {/* TODO: Add broadcast history */}
      {/* TODO: Add template library */}
      {/* TODO: Add scheduled broadcasts list */}
    </div>
  );
}

export default AdminBroadcast;
