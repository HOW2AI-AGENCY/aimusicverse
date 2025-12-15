import * as React from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import { ChevronLeft, Home } from "lucide-react";
import { Button } from "./button";

// Route configuration for breadcrumbs
const routeLabels: Record<string, string> = {
  "/": "Главная",
  "/library": "Библиотека",
  "/generate": "Генерация",
  "/projects": "Контент",
  "/profile": "Профиль",
  "/settings": "Настройки",
  "/admin": "Админка",
  "/studio": "Студия",
  "/blog": "Блог",
  "/leaderboard": "Лидеры",
};

interface SmartBreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  /** Custom labels for dynamic routes */
  customLabels?: Record<string, string>;
  /** Show home icon */
  showHomeIcon?: boolean;
  /** Max items to show before collapsing */
  maxItems?: number;
}

export const SmartBreadcrumbs: React.FC<SmartBreadcrumbsProps> = ({
  className,
  customLabels = {},
  showHomeIcon = true,
  maxItems = 4,
  ...props
}) => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) return null;

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label =
      customLabels[path] ||
      routeLabels[path] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === pathSegments.length - 1;

    return { path, label, isLast };
  });

  // Collapse middle items if too many
  const displayItems =
    breadcrumbItems.length > maxItems
      ? [
          breadcrumbItems[0],
          { path: "", label: "...", isLast: false, isCollapsed: true },
          ...breadcrumbItems.slice(-2),
        ]
      : breadcrumbItems;

  return (
    <Breadcrumb className={className} {...props}>
      <BreadcrumbList>
        {showHomeIcon && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        {displayItems.map((item, index) => (
          <React.Fragment key={item.path || index}>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.path}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

// Back button with smart navigation
interface BackButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  /** Fallback route if no history */
  fallbackRoute?: string;
  /** Custom label */
  label?: string;
  /** Show label */
  showLabel?: boolean;
}

export const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
  (
    { className, fallbackRoute = "/", label = "Назад", showLabel = false, ...props },
    ref
  ) => {
    const navigate = useNavigate();

    const handleBack = () => {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate(fallbackRoute);
      }
    };

    return (
      <Button
        ref={ref}
        variant="ghost"
        size={showLabel ? "sm" : "icon"}
        onClick={handleBack}
        className={cn("gap-1", className)}
        {...props}
      >
        <ChevronLeft className="h-4 w-4" />
        {showLabel && <span>{label}</span>}
      </Button>
    );
  }
);

BackButton.displayName = "BackButton";

// Page header with navigation
interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Show back button */
  showBack?: boolean;
  /** Show breadcrumbs */
  showBreadcrumbs?: boolean;
  /** Right side actions */
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className,
      title,
      subtitle,
      showBack = false,
      showBreadcrumbs = false,
      actions,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2 mb-6", className)}
        {...props}
      >
        {showBreadcrumbs && (
          <SmartBreadcrumbs className="text-sm text-muted-foreground" />
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {showBack && <BackButton />}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";
