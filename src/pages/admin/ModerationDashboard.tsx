// ModerationDashboard - Sprint 011 Admin (Enhanced - T099)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Clock, Loader2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';
import { motion } from '@/lib/motion';
import { formatDistanceToNow, ru } from '@/lib/date-utils';

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
type EntityType = 'comment' | 'track' | 'profile' | 'all';

const ITEMS_PER_PAGE = 10;

export default function ModerationDashboard() {
  const navigate = useNavigate();
  const { data: adminData, isLoading: isCheckingAdmin } = useAdminAuth();
  const isAdmin = adminData?.isAdmin ?? false;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReportStatus>('pending');
  const [entityFilter, setEntityFilter] = useState<EntityType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch reports with pagination and filtering
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['moderation-reports', activeTab, entityFilter, searchQuery, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('moderation_reports')
        .select('*, reported_user:profiles!moderation_reports_reported_user_id_fkey(display_name, username), reporter:profiles!moderation_reports_reporter_id_fkey(display_name, username)', { count: 'exact' })
        .eq('status', activeTab);

      // Apply entity type filter
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      // Apply search filter (search in reason and details)
      if (searchQuery.trim()) {
        query = query.or(`reason.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%`);
      }

      // Apply pagination
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;
      query = query.range(start, end);

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      
      return { 
        reports: data || [], 
        total: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      };
    },
    enabled: isAdmin,
  });

  const reports = reportsData?.reports || [];
  const totalPages = reportsData?.totalPages || 1;

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
      setSelectedReports(new Set());
    },
    onError: () => {
      toast.error('Ошибка обновления статуса');
    },
  });

  // Batch update mutation
  const batchUpdateMutation = useMutation({
    mutationFn: async ({ reportIds, status }: { reportIds: string[]; status: ReportStatus }) => {
      const { error } = await supabase
        .from('moderation_reports')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString() 
        })
        .in('id', reportIds);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      toast.success(`Обновлено ${variables.reportIds.length} жалоб`);
      setSelectedReports(new Set());
    },
    onError: () => {
      toast.error('Ошибка пакетного обновления');
    },
  });

  // Toggle report selection
  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  // Select all visible reports
  const toggleSelectAll = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(reports.map(r => r.id)));
    }
  };

  // Handle batch actions
  const handleBatchAction = (status: ReportStatus) => {
    if (selectedReports.size === 0) {
      toast.error('Выберите жалобы для обновления');
      return;
    }
    batchUpdateMutation.mutate({ 
      reportIds: Array.from(selectedReports), 
      status 
    });
  };

  // Reset filters
  const resetFilters = () => {
    setEntityFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

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
            {/* Filters and Search */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск по причине или деталям..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={entityFilter} onValueChange={(v: EntityType) => {
                      setEntityFilter(v);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        <SelectItem value="comment">Комментарии</SelectItem>
                        <SelectItem value="track">Треки</SelectItem>
                        <SelectItem value="profile">Профили</SelectItem>
                      </SelectContent>
                    </Select>
                    {(entityFilter !== 'all' || searchQuery) && (
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        Сбросить
                      </Button>
                    )}
                  </div>
                </div>

                {/* Batch Actions */}
                {selectedReports.size > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">
                      Выбрано: {selectedReports.size} из {reports.length}
                    </span>
                    <div className="flex gap-2">
                      {activeTab === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBatchAction('reviewed')}
                          >
                            Рассмотреть выбранные
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleBatchAction('dismissed')}
                          >
                            Отклонить выбранные
                          </Button>
                        </>
                      )}
                      {activeTab === 'reviewed' && (
                        <Button
                          size="sm"
                          onClick={() => handleBatchAction('resolved')}
                        >
                          Пометить решёнными
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Жалобы
                  {reportsData && reportsData.total > 0 && (
                    <Badge variant="secondary">{reportsData.total}</Badge>
                  )}
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
                    {(entityFilter !== 'all' || searchQuery) && (
                      <Button variant="link" onClick={resetFilters} className="mt-2">
                        Сбросить фильтры
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Select All Checkbox */}
                    {reports.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                        <Checkbox
                          checked={selectedReports.size === reports.length && reports.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                        <label className="text-sm text-muted-foreground cursor-pointer" onClick={toggleSelectAll}>
                          Выбрать все на странице
                        </label>
                      </div>
                    )}

                    <div className="space-y-4">
                      {reports?.map((report) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selectedReports.has(report.id)}
                              onCheckedChange={() => toggleReportSelection(report.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                                <p className="text-sm text-muted-foreground mb-2">{report.details}</p>
                              )}
                              {report.reporter && (
                                <p className="text-xs text-muted-foreground">
                                  Жалоба от: @{report.reporter.username || report.reporter.display_name}
                                </p>
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Страница {currentPage} из {totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
