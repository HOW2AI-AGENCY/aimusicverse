// ModerationDashboard Component - Sprint 011 Task T092
// Admin moderation dashboard for reviewing reported content

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertCircle,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from '@/lib/motion';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ModerationReport {
  id: string;
  entity_type: 'comment' | 'track' | 'profile';
  entity_id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  reporter: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  reported_user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  comment?: {
    content: string;
    is_moderated: boolean;
  };
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Спам',
  harassment: 'Оскорбления',
  inappropriate: 'Неподобающий контент',
  other: 'Другое',
};

/**
 * Admin moderation dashboard
 */
export default function ModerationDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed' | 'dismissed'>('pending');

  // Fetch moderation reports
  const {
    data: reports,
    isLoading,
    isError,
  } = useQuery<ModerationReport[]>({
    queryKey: ['moderation-reports', statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_reports')
        .select(\`
          id,
          entity_type,
          entity_id,
          reporter_id,
          reported_user_id,
          reason,
          details,
          status,
          created_at,
          reporter:profiles!moderation_reports_reporter_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          reported_user:profiles!moderation_reports_reported_user_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          comment:comments (
            content,
            is_moderated
          )
        \`)
        .eq('status', statusFilter)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ModerationReport[];
    },
    enabled: !!user,
  });

  // Hide comment mutation
  const hideCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .update({ is_moderated: true })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Комментарий скрыт');
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
    },
    onError: (error) => {
      console.error('Hide comment error:', error);
      toast.error('Не удалось скрыть комментарий');
    },
  });

  // Update report status mutation
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const { error } = await supabase
        .from('moderation_reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
    },
    onError: (error) => {
      console.error('Update report error:', error);
      toast.error('Не удалось обновить статус');
    },
  });

  const handleHideComment = async (reportId: string, commentId: string) => {
    await hideCommentMutation.mutateAsync(commentId);
    await updateReportMutation.mutateAsync({ reportId, status: 'reviewed' });
  };

  const handleDismissReport = (reportId: string) => {
    updateReportMutation.mutate({ reportId, status: 'dismissed' });
    toast.success('Жалоба отклонена');
  };

  // Check if user is admin
  const isAdmin = user?.email?.includes('admin') || false; // TODO: Proper admin check

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>У вас нет доступа к этой странице</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Модерация</h1>
            <p className="text-muted-foreground">Управление жалобами и контентом</p>
          </div>
        </motion.div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="pending">
              <AlertCircle className="w-4 h-4 mr-2" />
              Ожидают
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              <CheckCircle className="w-4 h-4 mr-2" />
              Рассмотрены
            </TabsTrigger>
            <TabsTrigger value="dismissed">
              <XCircle className="w-4 h-4 mr-2" />
              Отклонены
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Не удалось загрузить жалобы</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && reports?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Нет жалоб</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'pending' && 'Все жалобы рассмотрены'}
                {statusFilter === 'reviewed' && 'Нет рассмотренных жалоб'}
                {statusFilter === 'dismissed' && 'Нет отклоненных жалоб'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {!isLoading && reports && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={report.reporter.avatar_url || undefined} />
                          <AvatarFallback>
                            {report.reporter.display_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {report.reporter.display_name}{' '}
                            <span className="text-sm font-normal text-muted-foreground">
                              пожаловался на {report.reported_user.display_name}
                            </span>
                          </CardTitle>
                          <CardDescription>
                            {formatDistanceToNow(new Date(report.created_at), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={report.reason === 'harassment' ? 'destructive' : 'default'}>
                        {REASON_LABELS[report.reason] || report.reason}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Reported Content */}
                    {report.entity_type === 'comment' && report.comment && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Комментарий:</p>
                        <p className="text-sm">{report.comment.content}</p>
                        {report.comment.is_moderated && (
                          <Badge variant="outline" className="mt-2">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Скрыт
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Report Details */}
                    {report.details && (
                      <div>
                        <p className="text-sm font-medium mb-1">Детали жалобы:</p>
                        <p className="text-sm text-muted-foreground">{report.details}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {statusFilter === 'pending' && (
                      <div className="flex flex-wrap gap-2">
                        {report.entity_type === 'comment' && !report.comment?.is_moderated && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleHideComment(report.id, report.entity_id)}
                            disabled={hideCommentMutation.isPending}
                          >
                            <EyeOff className="w-4 h-4 mr-2" />
                            Скрыть комментарий
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismissReport(report.id)}
                          disabled={updateReportMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Отклонить жалобу
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
