/**
 * Privacy Tab
 * 
 * Privacy settings and blocked users management.
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';
import { motion } from '@/lib/motion';
import { PrivacySettings } from '@/components/settings/PrivacySettings';

interface PrivacyTabProps {
  onNavigate: (path: string) => void;
}

export function PrivacyTab({ onNavigate }: PrivacyTabProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PrivacySettings />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Заблокированные пользователи
            </CardTitle>
            <CardDescription>
              Управление списком заблокированных пользователей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onNavigate('/settings/blocked-users')}
            >
              <UserX className="w-4 h-4 mr-2" />
              Управление заблокированными
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
