import { useState } from 'react';
import { useHealthAlerts, useResolveAlert, useAlertStats } from '@/hooks/useHealthAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Bell,
  RefreshCw,
  History,
  AlertOctagon,
  TestTube
} from 'lucide-react';
import { formatDistanceToNow, format, ru } from '@/lib/date-utils';
import { toast } from 'sonner';

const statusConfig = {
  unhealthy: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Critical' },
  degraded: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Warning' },
  healthy: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Healthy' },
};

export function AlertHistoryPanel() {
  const { data: alerts, isLoading, refetch } = useHealthAlerts(100);
  const { data: stats } = useAlertStats();
  const resolveAlert = useResolveAlert();
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const handleResolve = async () => {
    if (!selectedAlertId) return;
    
    try {
      await resolveAlert.mutateAsync({ id: selectedAlertId, note: resolutionNote });
      toast.success('Инцидент отмечен как решённый');
      setResolveDialogOpen(false);
      setSelectedAlertId(null);
      setResolutionNote('');
    } catch {
      toast.error('Ошибка при обновлении');
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.alerts24h || 0}</div>
                <div className="text-xs text-muted-foreground">Алертов за 24ч</div>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.alertsWeek || 0}</div>
                <div className="text-xs text-muted-foreground">Алертов за неделю</div>
              </div>
              <History className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className={stats?.unresolved ? 'border-red-500/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.unresolved || 0}</div>
                <div className="text-xs text-muted-foreground">Нерешённых</div>
              </div>
              <AlertOctagon className={`h-8 w-8 ${stats?.unresolved ? 'text-red-500' : 'text-muted-foreground/30'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            История алертов
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !alerts?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет алертов
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const config = statusConfig[alert.overall_status as keyof typeof statusConfig] || statusConfig.healthy;
                  const StatusIcon = config.icon;
                  const isResolved = !!alert.resolved_at;
                  
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${config.bg} ${isResolved ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <StatusIcon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {config.label}
                              </span>
                              {alert.is_test && (
                                <Badge variant="outline" className="text-xs">
                                  <TestTube className="h-3 w-3 mr-1" />
                                  Test
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {alert.alert_type}
                              </Badge>
                              {isResolved && (
                                <Badge variant="default" className="text-xs bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            
                            {alert.unhealthy_services?.length > 0 && (
                              <div className="text-sm text-red-500">
                                ❌ {alert.unhealthy_services.join(', ')}
                              </div>
                            )}
                            {alert.degraded_services?.length > 0 && (
                              <div className="text-sm text-yellow-500">
                                ⚠️ {alert.degraded_services.join(', ')}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ru })}
                              </span>
                              <span>
                                📨 {alert.recipients_count} получателей
                              </span>
                            </div>
                            
                            {alert.resolution_note && (
                              <div className="text-xs text-green-600 mt-1">
                                ✅ {alert.resolution_note}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!isResolved && !alert.is_test && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAlertId(alert.id);
                              setResolveDialogOpen(true);
                            }}
                          >
                            Решён
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отметить инцидент как решённый</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Описание решения (опционально)"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleResolve} disabled={resolveAlert.isPending}>
              {resolveAlert.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
