import { Card } from "@/components/ui/card";
import { User, Smartphone } from "lucide-react";
import { useTelegram } from "@/contexts/TelegramContext";
import { useProfile } from "@/hooks/useProfile";
import { ProfileSkeleton } from "@/components/ui/skeleton-loader";

export const TelegramInfo = () => {
  const { user: telegramUser, platform, isDevelopmentMode } = useTelegram();
  const { data: profile, isLoading } = useProfile();

  // Use profile data from DB if available, fallback to Telegram context
  const displayUser = profile || telegramUser;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!displayUser) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-accent to-card">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-full bg-primary">
          <User className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {displayUser.first_name} {displayUser.last_name}
          </h3>
          {displayUser.username && (
            <p className="text-sm text-muted-foreground">@{displayUser.username}</p>
          )}
        </div>
      </div>
      
      {platform && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Smartphone className="w-4 h-4" />
          <span>Платформа: {platform}</span>
        </div>
      )}

      {isDevelopmentMode && (
        <div className="mt-2 text-xs text-muted-foreground">
          Dev Mode
        </div>
      )}
    </Card>
  );
};
