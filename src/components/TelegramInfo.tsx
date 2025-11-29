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
    <Card className="p-6 glass-card border-primary/20">
      <div className="flex items-center gap-4 mb-4">
        {displayUser.photo_url ? (
          <img
            src={displayUser.photo_url}
            alt="Avatar"
            className="w-14 h-14 rounded-full border-2 border-primary/30"
          />
        ) : (
          <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
            <User className="w-8 h-8 text-primary" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-foreground">
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
        <div className="mt-2 px-2 py-1 rounded bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
          <p className="text-xs text-yellow-200">Dev Mode</p>
        </div>
      )}
    </Card>
  );
};
