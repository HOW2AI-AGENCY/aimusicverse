/**
 * ProfessionalDashboardPage - Professional Studio Dashboard
 * Central hub for professional musicians with stats, workflows, and quick access
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { ProfessionalDashboard, QuickAccessPanel, StatsSummaryCard } from '@/components/professional';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTelegram } from '@/contexts/TelegramContext';

function ProfessionalDashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hapticFeedback } = useTelegram();

  const handleBack = () => {
    hapticFeedback?.('light');
    navigate(-1);
  };

  return (
    <PageContainer className="pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Professional Studio</h1>
          <p className="text-sm text-muted-foreground">
            Профессиональные инструменты
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/generate')}
          className="gap-1"
        >
          <Sparkles className="h-4 w-4" />
          Создать
        </Button>
      </motion.header>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Stats Summary - Compact on mobile */}
        {isMobile ? (
          <StatsSummaryCard useRealData />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProfessionalDashboard />
            </div>
            <div className="space-y-4">
              <StatsSummaryCard useRealData />
              <QuickAccessPanel variant="compact" maxActions={4} />
            </div>
          </div>
        )}

        {/* Mobile: Full Dashboard */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ProfessionalDashboard />
          </motion.div>
        )}
      </div>
    </PageContainer>
  );
}

export default memo(ProfessionalDashboardPage);
