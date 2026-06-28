import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessageSquare,
  Bug,
  Lightbulb,
  Star,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  RefreshCw,
} from "@/lib/icons";
import { logger } from "@/lib/logger";
import { format, ru } from "@/lib/date-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LazyImage } from "@/components/ui/lazy-image";

interface FeedbackItem {
  id: string;
  user_id: string | null;
  telegram_id: number | null;
  type: string;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  profile?: {
    username: string | null;
    first_name: string;
    photo_url: string | null;
  };
}

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  support: { icon: MessageSquare, label: "Поддержка", color: "bg-blue-500" },
  bug: { icon: Bug, label: "Ошибка", color: "bg-red-500" },
  idea: { icon: Lightbulb, label: "Идея", color: "bg-yellow-500" },
  rate: { icon: Star, label: "Оценка", color: "bg-purple-500" },
};

const statusConfig: Record<
  string,
  { icon: React.ElementType; label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { icon: Clock, label: "Ожидает", variant: "secondary" },
  replied: { icon: CheckCircle, label: "Отвечено", variant: "default" },
  closed: { icon: XCircle, label: "Закрыто", variant: "outline" },
};

export default function AdminFeedback() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isAdmin, setIsAdmin] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchFeedback();
    }
  }, [isAdmin, activeTab]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (!data) {
      toast.error("Доступ запрещён");
      navigate("/");
      return;
    }

    setIsAdmin(true);
  };

  const fetchFeedback = async () => {
    setLoading(true);

    let query = supabase.from("user_feedback").select("*").order("created_at", { ascending: false });

    if (activeTab !== "all") {
      query = query.eq("status", activeTab);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Ошибка загрузки");
      logger.error("Failed to load feedback", error);
    } else {
      const userIds = (data?.filter((f) => f.user_id).map((f) => f.user_id) || []).filter(
        (id): id is string => id !== null,
      );

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, first_name, photo_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        const enrichedData =
          data?.map((f) => ({
            ...f,
            profile: f.user_id ? profileMap.get(f.user_id) : undefined,
          })) || [];

        setFeedback(enrichedData);
      } else {
        setFeedback(data || []);
      }
    }

    setLoading(false);
  };

  const handleReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from("user_feedback")
        .update({
          admin_reply: replyText,
          status: "replied",
          replied_at: new Date().toISOString(),
        })
        .eq("id", selectedFeedback.id);

      if (error) throw error;

      if (selectedFeedback.telegram_id) {
        await supabase.functions.invoke("telegram-bot", {
          body: {
            action: "send_feedback_reply",
            telegram_id: selectedFeedback.telegram_id,
            message: replyText,
            feedback_type: selectedFeedback.type,
          },
        });
      }

      toast.success("Ответ отправлен");
      setReplyText("");
      setSelectedFeedback(null);
      setDetailSheetOpen(false);
      fetchFeedback();
    } catch (error: unknown) {
      logger.error("Failed to send feedback reply", error instanceof Error ? error : new Error(String(error)));
      toast.error("Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (id: string) => {
    const { error } = await supabase.from("user_feedback").update({ status: "closed" }).eq("id", id);

    if (error) {
      toast.error("Ошибка");
    } else {
      toast.success("Закрыто");
      fetchFeedback();
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null);
        setDetailSheetOpen(false);
      }
    }
  };

  const selectFeedback = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    if (isMobile) {
      setDetailSheetOpen(true);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const DetailPanel = () => (
    <div className="space-y-4">
      {selectedFeedback ? (
        <>
          {/* User Info */}
          <div className="flex items-center gap-3">
            {selectedFeedback.profile?.photo_url ? (
              <LazyImage src={selectedFeedback.profile.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">
                {selectedFeedback.profile?.username || selectedFeedback.profile?.first_name || "Пользователь"}
              </p>
              <p className="text-sm text-muted-foreground">ID: {selectedFeedback.telegram_id}</p>
            </div>
          </div>

          {/* Type & Date */}
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const config = typeConfig[selectedFeedback.type] || typeConfig.support;
              const TypeIcon = config.icon;
              return (
                <Badge className={config.color}>
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              );
            })()}
            <span className="text-xs md:text-sm text-muted-foreground">
              {format(new Date(selectedFeedback.created_at), "dd MMM yyyy, HH:mm", { locale: ru })}
            </span>
          </div>

          {/* Message */}
          <div className="p-3 md:p-4 bg-muted rounded-lg">
            <p className="whitespace-pre-wrap text-sm md:text-base">{selectedFeedback.message}</p>
          </div>

          {/* Previous Reply */}
          {selectedFeedback.admin_reply && (
            <div className="p-3 md:p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium mb-1">Ваш ответ:</p>
              <p className="whitespace-pre-wrap text-sm">{selectedFeedback.admin_reply}</p>
              {selectedFeedback.replied_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(selectedFeedback.replied_at), "dd MMM, HH:mm", { locale: ru })}
                </p>
              )}
            </div>
          )}

          {/* Reply Form */}
          {selectedFeedback.status !== "closed" && (
            <div className="space-y-3">
              <Textarea
                placeholder="Введите ответ..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={isMobile ? 3 : 4}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleReply}
                  disabled={!replyText.trim() || sending}
                  className="flex-1"
                  size={isMobile ? "sm" : "default"}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Отправка..." : "Отправить"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleClose(selectedFeedback.id)}
                  size={isMobile ? "sm" : "default"}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Выберите обращение</p>
        </div>
      )}
    </div>
  );

  const pendingCount = feedback.filter((f) => f.status === "pending").length;

  return (
    <div
      className="container max-w-6xl mx-auto p-3 md:p-4 pb-[calc(6rem+env(safe-area-inset-bottom))]"
      style={{
        paddingTop:
          "max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.75rem), calc(env(safe-area-inset-top, 0px) + 0.75rem))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg md:text-2xl font-bold truncate">
            Обратная связь
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFeedback} className="shrink-0">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Обновить</span>
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        {isMobile ? (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">🕐 Ожидают</SelectItem>
              <SelectItem value="replied">✅ Отвечено</SelectItem>
              <SelectItem value="closed">❌ Закрыто</SelectItem>
              <SelectItem value="all">📋 Все</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-2">
            {[
              { value: "pending", label: "Ожидают", icon: Clock },
              { value: "replied", label: "Отвечено", icon: CheckCircle },
              { value: "closed", label: "Закрыто", icon: XCircle },
              { value: "all", label: "Все", icon: MessageSquare },
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={activeTab === value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(value)}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Feedback List */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Обращения ({feedback.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)] min-h-[300px]">
              <div className="p-3 space-y-2">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : feedback.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Нет сообщений</div>
                ) : (
                  feedback.map((item) => {
                    const config = typeConfig[item.type] || typeConfig.support;
                    const TypeIcon = config.icon;
                    const status = statusConfig[item.status] || statusConfig.pending;

                    return (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-all hover:bg-accent/50 active:scale-[0.98] ${selectedFeedback?.id === item.id ? "ring-2 ring-primary bg-accent/30" : ""}`}
                        onClick={() => selectFeedback(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`p-1.5 rounded shrink-0 ${config.color}`}>
                                <TypeIcon className="h-3 w-3 md:h-4 md:w-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {item.profile?.username || item.profile?.first_name || `ID: ${item.telegram_id}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(item.created_at), "dd.MM, HH:mm", { locale: ru })}
                                </p>
                              </div>
                            </div>
                            <Badge variant={status.variant} className="shrink-0 text-xs">
                              {status.label}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs md:text-sm line-clamp-2 text-muted-foreground">{item.message}</p>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail Panel - Desktop Only */}
        {!isMobile && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base">
                {selectedFeedback ? "Детали обращения" : "Выберите обращение"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailPanel />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Detail Sheet */}
      {isMobile && (
        <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setDetailSheetOpen(false)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                Детали обращения
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(85vh-80px)]">
              <div className="pr-4">
                <DetailPanel />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
