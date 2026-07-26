import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import { User } from "@/lib/icons";
import type { TelegramUser } from "@/contexts/TelegramContext";

interface ProfileCardProps {
  displayUser: { photo_url?: string; first_name?: string; last_name?: string; username?: string } | TelegramUser | null;
  subscriptionTier?: string | null;
}

export function ProfileCard({ displayUser, subscriptionTier }: ProfileCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-6 lg:p-8 glass-card border-primary/20 transition-shadow hover:shadow-lg">
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 lg:border-3 border-primary/30 shadow-lg transition-transform hover:scale-105">
            {displayUser?.photo_url ? (
              <LazyImage src={displayUser.photo_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <User className="w-10 h-10 lg:w-14 lg:h-14 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {displayUser?.first_name} {displayUser?.last_name}
            </h1>
            {displayUser?.username && <p className="text-muted-foreground lg:text-lg">@{displayUser.username}</p>}
            {subscriptionTier && (
              <span className="inline-block mt-1 lg:mt-2 px-2 lg:px-3 py-0.5 lg:py-1 text-xs lg:text-sm font-medium rounded-full bg-primary/20 text-primary">
                {subscriptionTier === "premium" ? "Premium" : subscriptionTier === "enterprise" ? "Enterprise" : "Free"}
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
