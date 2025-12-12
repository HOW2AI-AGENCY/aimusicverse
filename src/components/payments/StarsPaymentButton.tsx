/**
 * StarsPaymentButton Component
 * Button with Telegram Stars icon for initiating payments
 */

import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StarsPaymentButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'glass' | 'glow';
  size?: 'default' | 'sm' | 'lg' | 'xl';
  className?: string;
  showIcon?: boolean;
}

export function StarsPaymentButton({
  onClick,
  isLoading = false,
  disabled = false,
  children = 'Buy with Stars',
  variant = 'glow',
  size = 'default',
  className,
  showIcon = true,
}: StarsPaymentButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        isLoading && 'cursor-wait',
        className
      )}
      aria-label="Pay with Telegram Stars"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {showIcon && (
            <Sparkles 
              className="mr-2 h-4 w-4" 
              aria-hidden="true"
            />
          )}
          <span>{children}</span>
        </>
      )}
    </Button>
  );
}
