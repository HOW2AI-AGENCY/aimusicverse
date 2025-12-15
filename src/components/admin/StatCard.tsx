/**
 * Reusable stat card component for admin dashboard
 */
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: "default" | "warning" | "info" | "success" | "error" | "muted";
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  variant = "default",
  active,
  onClick,
  className,
}: StatCardProps) {
  const isClickable = !!onClick;
  
  return (
    <Card 
      className={cn(
        "transition-all",
        isClickable && "cursor-pointer hover:border-primary/50",
        active && "border-primary bg-primary/5",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-2 md:p-3">
        <div className="flex items-center justify-between mb-1">
          {icon}
          <p className="text-lg md:text-xl font-bold">{value}</p>
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{title}</p>
      </CardContent>
    </Card>
  );
}

interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 6;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const colsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };
  
  return (
    <div className={cn("grid gap-2 md:gap-3", colsClass[columns], className)}>
      {children}
    </div>
  );
}
