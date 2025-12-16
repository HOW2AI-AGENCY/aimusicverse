import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, Coins, MessageSquare, Shield, ShieldOff, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface UserWithRoles {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  created_at: string;
  roles: string[];
  subscription_tier?: string;
  subscription_expires_at?: string | null;
  balance?: number;
  level?: number;
}

interface AdminUserCardProps {
  user: UserWithRoles;
  isSelected: boolean;
  onSelect: () => void;
  onCredits: () => void;
  onSubscription: () => void;
  onMessage: () => void;
  onToggleAdmin: (action: "add" | "remove") => void;
}

export function AdminUserCard({
  user,
  isSelected,
  onSelect,
  onCredits,
  onSubscription,
  onMessage,
  onToggleAdmin,
}: AdminUserCardProps) {
  const isAdmin = user.roles.includes("admin");
  const isModerator = user.roles.includes("moderator");
  const hasPremium = user.subscription_tier && user.subscription_tier !== "free";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg border bg-card transition-colors ${
        isSelected ? "border-primary bg-primary/5" : ""
      }`}
    >
      {/* Top row: checkbox, avatar, name, actions */}
      <div className="flex items-center gap-2 w-full">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="flex-shrink-0 h-4 w-4"
        />

        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user.photo_url || undefined} />
          <AvatarFallback className="text-xs">
            {user.first_name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">
              {user.first_name} {user.last_name}
            </span>
            {/* Badges */}
            <div className="flex items-center gap-0.5">
              {isAdmin && (
                <Badge className="h-4 px-1 text-[9px]">A</Badge>
              )}
              {isModerator && (
                <Badge variant="secondary" className="h-4 px-1 text-[9px]">M</Badge>
              )}
              {hasPremium && (
                <Crown className="h-3 w-3 text-yellow-500" />
              )}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            @{user.username || "—"}
          </div>
        </div>

        {/* Balance - visible on all screens */}
        <div className="text-right flex-shrink-0 px-1 sm:px-2">
          <div className={`text-xs sm:text-sm font-bold ${
            (user.balance || 0) === 0 ? 'text-muted-foreground' : 
            (user.balance || 0) < 10 ? 'text-amber-500' : 'text-primary'
          }`}>
            {user.balance || 0} ₵
          </div>
          <div className="text-[9px] text-muted-foreground">
            Lvl {user.level || 1}
          </div>
        </div>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onMessage}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Написать
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSubscription}>
              <Crown className="h-4 w-4 mr-2" />
              Подписка
              {hasPremium && (
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {user.subscription_tier}
                </Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCredits}>
              <Coins className="h-4 w-4 mr-2" />
              Кредиты ({user.balance || 0})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!isAdmin ? (
              <DropdownMenuItem onClick={() => onToggleAdmin("add")}>
                <Shield className="h-4 w-4 mr-2" />
                Назначить админом
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => onToggleAdmin("remove")}
                className="text-destructive"
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                Убрать админа
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
