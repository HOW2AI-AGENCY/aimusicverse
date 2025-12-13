import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useModerationReports, useHideComment, useResolveReport, useWarnUser } from '@/hooks/moderation/useModerationReports';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ModerationReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  entity_type: 'comment' | 'track' | 'profile';
  entity_id: string;
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'other';
  description: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  reporter: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  reported_user: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  comment?: {
    content: string;
    is_moderated: boolean;
  };
}

export function ModerationDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerHapticFeedback } = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'dismissed'>('pending');
  const [actionDialog, setActionDialog] = useState<{
    type: 'hide' | 'dismiss' | 'warn' | null;
    reportId: string | null;
    commentId?: string | null;
    userId?: string | null;
  }>({ type: null, reportId: null });

  // Check if user is admin (TODO: Replace with proper RBAC)
  // WARNING: This is a temporary check. For production, implement proper role-based access control
  // with a roles table or user metadata field verified by RLS policies
  const isAdmin = user?.email?.includes('admin@') || user?.email?.includes('@admin');

  // Use the new hooks
  const { data: reports, isLoading } = useModerationReports(activeTab);
  const hideCommentMutation = useHideComment();
  const resolveReportMutation = useResolveReport();
  const warnUserMutation = useWarnUser();

  const reasonLabels: Record<string, string> = {
    spam: 'Spam',
    harassment: 'Harassment',
    inappropriate_content: 'Inappropriate Content',
    other: 'Other',
  };

  const handleAction = () => {
    if (!actionDialog.reportId) return;

    const report = reports?.find((r) => r.id === actionDialog.reportId);
    if (!report) return;

    triggerHapticFeedback('light');

    if (actionDialog.type === 'hide' && report.entity_type === 'comment') {
      // Hide comment and resolve report
      hideCommentMutation.mutate(report.entity_id, {
        onSuccess: () => {
          resolveReportMutation.mutate({
            reportId: report.id,
            status: 'reviewed',
            resolutionNote: 'Comment hidden',
          });
          setActionDialog({ type: null, reportId: null });
        },
      });
    } else if (actionDialog.type === 'dismiss') {
      resolveReportMutation.mutate({
        reportId: report.id,
        status: 'dismissed',
      }, {
        onSuccess: () => {
          setActionDialog({ type: null, reportId: null });
        },
      });
    } else if (actionDialog.type === 'warn' && actionDialog.userId) {
      warnUserMutation.mutate({
        userId: actionDialog.userId,
        reason: `Report: ${reasonLabels[report.reason]} - ${report.description || 'No details'}`,
      }, {
        onSuccess: () => {
          resolveReportMutation.mutate({
            reportId: report.id,
            status: 'reviewed',
            resolutionNote: 'User warned',
          });
          setActionDialog({ type: null, reportId: null });
        },
      });
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the moderation dashboard.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Moderation Dashboard</h1>
          </div>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Moderation Dashboard</h1>
            <p className="text-sm text-muted-foreground">Review and manage reported content</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              Pending {reports && activeTab === 'pending' && `(${reports.length})`}
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex-1">
              Reviewed
            </TabsTrigger>
            <TabsTrigger value="dismissed" className="flex-1">
              Dismissed
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {!reports || reports.length === 0 ? (
              <div className="text-center p-12">
                <p className="text-muted-foreground">No {activeTab} reports</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="bg-card border rounded-lg p-4 space-y-4">
                    {/* Report Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={report.reporter.avatar_url || undefined}
                            alt={report.reporter.display_name || 'Reporter'}
                          />
                          <AvatarFallback>
                            {(report.reporter.display_name || 'U').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            Reported by {report.reporter.display_name || report.reporter.username || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </div>

                    {/* Reported User */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={report.reported_user.avatar_url || undefined}
                          alt={report.reported_user.display_name || 'Reported User'}
                        />
                        <AvatarFallback>
                          {(report.reported_user.display_name || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {report.reported_user.display_name || report.reported_user.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">Reported User</p>
                      </div>
                    </div>

                    {/* Report Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{reasonLabels[report.reason]}</Badge>
                        <Badge variant="outline">{report.entity_type}</Badge>
                      </div>
                      {report.description && (
                        <p className="text-sm text-muted-foreground italic">"{report.description}"</p>
                      )}
                    </div>

                    {/* Comment Content */}
                    {report.comment && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm mb-2">{report.comment.content}</p>
                        {report.comment.is_moderated && (
                          <Badge variant="destructive" className="text-xs">
                            Hidden
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {report.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        {report.entity_type === 'comment' && !report.comment?.is_moderated && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setActionDialog({ type: 'hide', reportId: report.id })}
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide Comment
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-500 text-orange-500 hover:bg-orange-50"
                          onClick={() => setActionDialog({ 
                            type: 'warn', 
                            reportId: report.id,
                            userId: report.reported_user?.id 
                          })}
                          disabled={!report.reported_user?.id}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Warn User
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActionDialog({ type: 'dismiss', reportId: report.id })}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Dismiss Report
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={actionDialog.type !== null}
        onOpenChange={(open) => !open && setActionDialog({ type: null, reportId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'hide' 
                ? 'Hide Comment?' 
                : actionDialog.type === 'warn'
                ? 'Warn User?'
                : 'Dismiss Report?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === 'hide'
                ? 'This will hide the comment from all users. The comment author will still see it marked as moderated.'
                : actionDialog.type === 'warn'
                ? 'This will increment the user\'s strike count. After 3 strikes, the user will be temporarily banned for 24 hours.'
                : 'This will mark the report as dismissed. No action will be taken on the reported content.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={hideCommentMutation.isPending || resolveReportMutation.isPending || warnUserMutation.isPending}
            >
              {(hideCommentMutation.isPending || resolveReportMutation.isPending || warnUserMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
