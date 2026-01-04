/**
 * NavigationProvider - Sets up global navigation for non-hook contexts
 * This component should be placed inside Router but wrapping the app
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setGlobalNavigate } from '@/hooks/useAppNavigate';

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Set up global navigate function for class components and non-hook contexts
    setGlobalNavigate((path, options) => {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        window.open(path, '_blank', 'noopener,noreferrer');
        return;
      }
      navigate(path, options);
    });
  }, [navigate]);

  return <>{children}</>;
}
