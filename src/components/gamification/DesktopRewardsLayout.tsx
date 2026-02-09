/**
 * Desktop Rewards Layout - Two-column dashboard for rewards page
 * Left: Missions and calendar | Right: Achievements and leaderboard
 */

import { ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface DesktopRewardsLayoutProps {
  header: ReactNode;
  levelSection: ReactNode;
  checkinSection: ReactNode;
  streakSection: ReactNode;
  statsSection: ReactNode;
  missionsSection: ReactNode;
  achievementsSection: ReactNode;
  className?: string;
}

export function DesktopRewardsLayout({
  header,
  levelSection,
  checkinSection,
  streakSection,
  statsSection,
  missionsSection,
  achievementsSection,
  className,
}: DesktopRewardsLayoutProps) {
  return (
    <div className={cn("space-y-6 lg:space-y-8", className)}>
      {/* Header - Full width */}
      {header}

      {/* Main Grid - Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column - Level, Checkin, Missions */}
        <motion.div
          className="space-y-4 lg:space-y-5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {/* Level Card */}
          <div className="bg-card rounded-xl lg:rounded-2xl border border-border/50 p-4 lg:p-5 transition-shadow hover:shadow-md">
            {levelSection}
          </div>

          {/* Daily Checkin */}
          <div className="bg-card rounded-xl lg:rounded-2xl border border-border/50 p-4 lg:p-5 transition-shadow hover:shadow-md">
            {checkinSection}
          </div>

          {/* Streak Calendar */}
          <div className="bg-card rounded-xl lg:rounded-2xl border border-border/50 p-4 lg:p-5 transition-shadow hover:shadow-md">
            {streakSection}
          </div>

          {/* Missions */}
          <div className="bg-card rounded-xl lg:rounded-2xl border border-border/50 p-4 lg:p-5 transition-shadow hover:shadow-md">
            {missionsSection}
          </div>
        </motion.div>

        {/* Right Column - Stats, Achievements */}
        <motion.div
          className="space-y-4 lg:space-y-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Quick Stats */}
          <div className="bg-card rounded-xl lg:rounded-2xl border border-border/50 p-4 lg:p-5 transition-shadow hover:shadow-md">
            {statsSection}
          </div>

          {/* Achievements & Leaderboard */}
          <div className="bg-card rounded-xl lg:rounded-2xl border border-border/50 p-4 lg:p-5 min-h-[400px] lg:min-h-[500px] transition-shadow hover:shadow-md">
            {achievementsSection}
          </div>
        </motion.div>
      </div>
    </div>
  );
}