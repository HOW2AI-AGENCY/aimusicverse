import { ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/contexts/TelegramContext";

type TelegramHapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

interface TelegramButtonProps extends Omit<ButtonProps, 'haptic'> {
  children: ReactNode;
  icon?: ReactNode;
  haptic?: TelegramHapticType;
}

export const TelegramButton = ({
  children,
  icon,
  haptic = "light",
  className,
  onClick,
  ...props
}: TelegramButtonProps) => {
  const { hapticFeedback } = useTelegram();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    hapticFeedback(haptic);
    onClick?.(e);
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        "active:scale-95",
        "hover:shadow-lg hover:shadow-primary/20",
        icon && "flex items-center gap-2",
        className
      )}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </Button>
  );
};
