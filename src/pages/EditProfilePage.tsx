// EditProfilePage Component - Sprint 011 Task T031
// Standalone page for editing profile (for navigation)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { motion } from '@/lib/motion';

export function EditProfilePage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(true);

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Navigate back when dialog closes
      navigate(-1);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </motion.div>

      <ProfileEditDialog open={dialogOpen} onOpenChange={handleDialogClose} />
    </div>
  );
}

export default EditProfilePage;
