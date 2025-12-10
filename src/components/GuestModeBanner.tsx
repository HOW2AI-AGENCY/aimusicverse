import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useGuestMode } from '@/contexts/GuestModeContext';

export const GuestModeBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const { disableGuestMode } = useGuestMode();

  if (!isVisible) return null;

  const handleSignIn = () => {
    disableGuestMode();
    navigate('/auth');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            🎵 Гостевой режим • Просмотр без авторизации
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignIn}
            className="text-white hover:bg-white/20 text-xs"
          >
            Войти
          </Button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
