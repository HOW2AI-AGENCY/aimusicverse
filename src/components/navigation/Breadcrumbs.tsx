import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Route to label mapping
const ROUTE_LABELS: Record<string, string> = {
  '': 'Главная',
  'library': 'Библиотека',
  'projects': 'Проекты',
  'studio': 'Студия',
  'profile': 'Профиль',
  'settings': 'Настройки',
  'music-lab': 'Music Lab',
  'creative-tools': 'Творческие инструменты',
  'admin': 'Админ',
  'track': 'Трек',
  'album': 'Альбом',
  'artist': 'Артист',
  'playlist': 'Плейлист',
  'blog': 'Блог',
};

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from path if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const result: BreadcrumbItem[] = [];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Skip UUID segments for display but include in path
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      
      if (!isUuid) {
        result.push({
          label: ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: isLast ? undefined : currentPath,
        });
      }
    });
    
    return result;
  })();

  if (breadcrumbItems.length === 0 && !showHome) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {showHome && (
          <li className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center hover:text-foreground transition-colors"
              aria-label="Главная"
            >
              <Home className="h-4 w-4" />
            </Link>
            {breadcrumbItems.length > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
            )}
          </li>
        )}
        
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {item.href ? (
                <Link 
                  to={item.href}
                  className="hover:text-foreground transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className="text-foreground font-medium truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
