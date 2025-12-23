// ModerationDashboard - Sprint 011 Admin
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';
import { motion } from '@/lib/motion';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export default function ModerationDashboard() {
  const navigate = useNavigate();
  const { data: adminData, isLoading: isCheckingAdmin } = useAdminAuth();
  const isAdmin = adminData?.isAdmin ?? false;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReportStatus>('pending');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['moderation-reports', activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_reports')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: ReportStatus }) => {
      const { error } = await supabase
        .from('moderation_reports')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      toast.success('Статус обновлён');
    },
    onError: () => {
      toast.error('Ошибка обновления статуса');
    },
  });

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Доступ запрещён</h2>
            <p className="text-muted-foreground mb-4">
              У вас нет прав для просмотра этой страницы
            </p>
            <Button onClick={() => navigate('/')}>На главную</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Ожидает</Badge>;
      case 'reviewed':
        return <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3" /> На проверке</Badge>;
      case 'resolved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="w-3 h-3" /> Решено</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="gap-1 text-muted-foreground">Отклонено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24"
      style={{
        paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.5rem), calc(env(safe-area-inset-top, 0px) + 0.5rem))'
      }}
    >
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Модерация</h1>
            <p className="text-sm text-muted-foreground">
              Управление жалобами и нарушениями
            </p>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="pending">Ожидает</TabsTrigger>
            <TabsTrigger value="reviewed">На проверке</TabsTrigger>
            <TabsTrigger value="resolved">Решено</TabsTrigger>
            <TabsTrigger value="dismissed">Отклонено</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Жалобы
                </CardTitle>
                <CardDescription>
                  Список жалоб со статусом "{activeTab}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : reports?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Нет жалоб с этим статусом</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports?.map((report) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(report.status)}
                              <Badge variant="outline">{report.entity_type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(report.created_at), { 
                                  addSuffix: true, 
                                  locale: ru 
                                })}
                              </span>
                            </div>
                            <p className="font-medium mb-1">{report.reason}</p>
                            {report.details && (
                              <p className="text-sm text-muted-foreground">{report.details}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {report.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({ 
                                    reportId: report.id, 
                                    status: 'reviewed' 
                                  })}
                                >
                                  Рассмотреть
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateStatusMutation.mutate({ 
                                    reportId: report.id, 
                                    status: 'dismissed' 
                                  })}
                                >
                                  Отклонить
                                </Button>
                              </>
                            )}
                            {report.status === 'reviewed' && (
                              <Button
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ 
                                  reportId: report.id, 
                                  status: 'resolved' 
                                })}
                              >
                                Решено
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
