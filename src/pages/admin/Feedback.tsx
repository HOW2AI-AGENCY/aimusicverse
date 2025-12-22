import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, Bug, Lightbulb, Star, Send, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const statusConfig: Record<string, { icon: React.ElementType; label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { icon: Clock, label: "Ожидает", variant: "secondary" },
  replied: { icon: CheckCircle, label: "Отвечено", variant: "default" },
  closed: { icon: XCircle, label: "Закрыто", variant: "outline" },
};

export default function AdminFeedback() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isAdmin, setIsAdmin] = useState(false);

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
    
    const { data } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (!data) {
      toast.error("Доступ запрещён");
      navigate("/");
      return;
    }
    
    setIsAdmin(true);
  };

  const fetchFeedback = async () => {
    setLoading(true);
    
    let query = supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (activeTab !== "all") {
      query = query.eq('status', activeTab);
    }
    
    const { data, error } = await query;
    
    if (error) {
      toast.error("Ошибка загрузки");
      console.error(error);
    } else {
      // Fetch profiles for users with user_id
      const userIds = (data?.filter(f => f.user_id).map(f => f.user_id) || []).filter((id): id is string => id !== null);
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, first_name, photo_url')
          .in('user_id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const enrichedData = data?.map(f => ({
          ...f,
          profile: f.user_id ? profileMap.get(f.user_id) : undefined
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
      // Update feedback with reply
      const { error } = await supabase
        .from('user_feedback')
        .update({
          admin_reply: replyText,
          status: 'replied',
          replied_at: new Date().toISOString()
        })
        .eq('id', selectedFeedback.id);
      
      if (error) throw error;
      
      // Send reply via Telegram if telegram_id exists
      if (selectedFeedback.telegram_id) {
        await supabase.functions.invoke('telegram-bot', {
          body: {
            action: 'send_feedback_reply',
            telegram_id: selectedFeedback.telegram_id,
            message: replyText,
            feedback_type: selectedFeedback.type
          }
        });
      }
      
      toast.success("Ответ отправлен");
      setReplyText("");
      setSelectedFeedback(null);
      fetchFeedback();
    } catch (error) {
      console.error(error);
      toast.error("Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (id: string) => {
    const { error } = await supabase
      .from('user_feedback')
      .update({ status: 'closed' })
      .eq('id', id);
    
    if (error) {
      toast.error("Ошибка");
    } else {
      toast.success("Закрыто");
      fetchFeedback();
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null);
      }
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Обратная связь</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback List */}
        <Card>
          <CardHeader className="pb-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Ожидают</TabsTrigger>
                <TabsTrigger value="replied">Отвечено</TabsTrigger>
                <TabsTrigger value="all">Все</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : feedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет сообщений
                </div>
              ) : (
                <div className="space-y-3">
                  {feedback.map((item) => {
                    const config = typeConfig[item.type] || typeConfig.support;
                    const TypeIcon = config.icon;
                    const status = statusConfig[item.status] || statusConfig.pending;
                    
                    return (
                      <Card 
                        key={item.id} 
                        className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedFeedback?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedFeedback(item)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${config.color}`}>
                                <TypeIcon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {item.profile?.username || item.profile?.first_name || `ID: ${item.telegram_id}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(item.created_at), "dd MMM, HH:mm", { locale: ru })}
                                </p>
                              </div>
                            </div>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm line-clamp-2">{item.message}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedFeedback ? "Детали обращения" : "Выберите обращение"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedFeedback ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  {selectedFeedback.profile?.photo_url ? (
                    <img 
                      src={selectedFeedback.profile.photo_url} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {selectedFeedback.profile?.username || selectedFeedback.profile?.first_name || "Пользователь"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Telegram ID: {selectedFeedback.telegram_id}
                    </p>
                  </div>
                </div>

                {/* Type & Date */}
                <div className="flex items-center gap-2">
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
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedFeedback.created_at), "dd MMMM yyyy, HH:mm", { locale: ru })}
                  </span>
                </div>

                {/* Message */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>

                {/* Previous Reply */}
                {selectedFeedback.admin_reply && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium mb-1">Ваш ответ:</p>
                    <p className="whitespace-pre-wrap">{selectedFeedback.admin_reply}</p>
                    {selectedFeedback.replied_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(selectedFeedback.replied_at), "dd MMM, HH:mm", { locale: ru })}
                      </p>
                    )}
                  </div>
                )}

                {/* Reply Form */}
                {selectedFeedback.status !== 'closed' && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Введите ответ..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleReply} 
                        disabled={!replyText.trim() || sending}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {sending ? "Отправка..." : "Отправить ответ"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleClose(selectedFeedback.id)}
                      >
                        Закрыть
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Выберите обращение из списка слева</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}