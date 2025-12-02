import { Card } from '@/components/ui/card';
import { Lightbulb, Code } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface FormHelperProps {
  tips?: string[];
  examples?: string[];
  className?: string;
}

export function FormHelper({ tips, examples, className }: FormHelperProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!tips?.length && !examples?.length) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          {isOpen ? 'Hide' : 'Show'} Tips & Examples
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className={`p-4 bg-muted/30 border-dashed ${className}`}>
          <div className="space-y-4 text-sm">
            {/* Tips Section */}
            {tips && tips.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Lightbulb className="h-4 w-4" />
                  <h4 className="font-semibold">Tips</h4>
                </div>
                <ul className="space-y-1 ml-6 list-disc text-muted-foreground">
                  {tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Examples Section */}
            {examples && examples.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Code className="h-4 w-4" />
                  <h4 className="font-semibold">Examples</h4>
                </div>
                <div className="space-y-2">
                  {examples.map((example, index) => (
                    <div
                      key={index}
                      className="p-2 bg-background/50 rounded border text-xs font-mono"
                    >
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
