/**
 * PrivacyToggle - Toggle for track visibility (public/private)
 */

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, Globe, Crown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SECTION_HINTS } from '../SectionLabel';

interface PrivacyToggleProps {
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  canMakePrivate?: boolean;
  className?: string;
}

export function PrivacyToggle({
  isPublic,
  onIsPublicChange,
  canMakePrivate = false,
  className,
}: PrivacyToggleProps) {
  const handleChange = (checked: boolean) => {
    // Checked = public, unchecked = private
    if (!checked && !canMakePrivate) {
      // Can't make private without subscription
      return;
    }
    onIsPublicChange(checked);
  };

  return (
    <div className={cn(
      'flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2.5 border border-muted-foreground/10',
      className
    )}>
      <div className="flex items-center gap-2">
        {isPublic ? (
          <Globe className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Lock className="w-4 h-4 text-primary" />
        )}
        <Label htmlFor="privacy-toggle" className="text-sm cursor-pointer">
          {isPublic ? 'Публичный' : 'Приватный'}
        </Label>
        
        {/* Help icon */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                type="button" 
                className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-xs">
              {SECTION_HINTS.privacy}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center gap-2">
        {!canMakePrivate && !isPublic && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Crown className="w-4 h-4 text-yellow-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Приватные треки доступны по подписке</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Switch
          id="privacy-toggle"
          checked={isPublic}
          onCheckedChange={handleChange}
          disabled={!isPublic && !canMakePrivate}
        />
      </div>
    </div>
  );
}