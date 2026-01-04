import { ReactNode } from 'react';
import { InteractiveTooltip } from './InteractiveTooltip';
import { useTooltips } from './TooltipProvider';

interface TooltipWrapperProps {
  tooltipId: string;
  children: ReactNode;
  className?: string;
}

export function TooltipWrapper({ tooltipId, children, className }: TooltipWrapperProps) {
  const { 
    shouldShowTooltip, 
    getTooltipConfig, 
    markAsSeen, 
    dismissAndShowNext,
    getAvailableTooltips 
  } = useTooltips();

  const config = getTooltipConfig(tooltipId);
  const isVisible = shouldShowTooltip(tooltipId);
  const availableTooltips = getAvailableTooltips();
  const hasNext = availableTooltips.length > 1;

  if (!config) {
    return <>{children}</>;
  }

  if (!isVisible) {
    return <>{children}</>;
  }

  return (
    <InteractiveTooltip
      config={config}
      onDismiss={() => markAsSeen(tooltipId)}
      onNext={dismissAndShowNext}
      hasNext={hasNext}
      className={className}
    >
      {children}
    </InteractiveTooltip>
  );
}
