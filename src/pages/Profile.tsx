import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Settings, Activity } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  language_code?: string;
  photo_url?: string;
}

interface UserActivity {
  id: string;
  action_type: string;
  action_data?: any;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { hapticFeedback, showBackButton, hideBackButton } = useTelegram();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    showBackButton(() => navigate("/"));
    return () => hideBackButton();
  }, [navigate, showBackButton, hideBackButton]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadActivities();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  const handleSaveSettings = async () => {
    hapticFeedback("light");
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      // Log activity
      await supabase.from("user_activity").insert({
        user_id: user?.id,
        action_type: "profile_updated",
        action_data: { first_name: firstName, last_name: lastName },
      });

      hapticFeedback("success");
      toast.success("Настройки сохранены!");
      loadProfile();
      loadActivities();
    } catch (error) {
      console.error("Error saving settings:", error);
      hapticFeedback("error");
      toast.error("Ошибка сохранения настроек");
    }
  };

  const handleLogout = async () => {
    hapticFeedback("medium");
    await logout();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0 glass rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Профиль
          </h1>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-card border-primary/20">
            <TabsTrigger value="info" className="data-[state=active]:bg-primary/20">
              <User className="w-4 h-4 mr-2" />
              Инфо
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary/20">
              <Settings className="w-4 h-4 mr-2" />
              Настройки
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-primary/20">
              <Activity className="w-4 h-4 mr-2" />
              Активность
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle>Telegram Данные</CardTitle>
                <CardDescription>
                  Информация из вашего Telegram аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 border-2 border-primary/30">
                    <AvatarImage src={profile?.photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    {profile?.username && (
                      <p className="text-sm text-muted-foreground">
                        @{profile.username}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-primary/10">
                    <span className="text-muted-foreground">Telegram ID:</span>
                    <span className="font-medium">{profile?.telegram_id}</span>
                  </div>
                  {profile?.language_code && (
                    <div className="flex justify-between py-2 border-b border-primary/10">
                      <span className="text-muted-foreground">Язык:</span>
                      <span className="font-medium">{profile.language_code}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle>Настройки профиля</CardTitle>
                <CardDescription>
                  Измените информацию о своём профиле
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Введите имя"
                    className="glass border-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Введите фамилию"
                    className="glass border-primary/20"
                  />
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Сохранить изменения
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full"
                >
                  Выйти из аккаунта
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle>История активности</CardTitle>
                <CardDescription>
                  Ваши последние действия в приложении
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Пока нет активности
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex justify-between items-center p-3 rounded-lg glass border border-primary/10"
                      >
                        <div>
                          <p className="font-medium">
                            {activity.action_type === "profile_updated"
                              ? "Профиль обновлён"
                              : activity.action_type === "login"
                              ? "Вход в систему"
                              : activity.action_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString("ru-RU")}
                          </p>
                        </div>
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      </div>
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
