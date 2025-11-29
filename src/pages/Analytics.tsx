import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full glass-card border-primary/20">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Аналитика
            </h1>
            <p className="text-muted-foreground">Статистика и аналитика</p>
          </div>
        </div>

        <Card className="p-12 glass-card border-primary/20 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">Скоро здесь появится аналитика</h3>
          <p className="text-sm text-muted-foreground">
            Эта функция находится в разработке
          </p>
        </Card>
      </div>
    </div>
  );
}
