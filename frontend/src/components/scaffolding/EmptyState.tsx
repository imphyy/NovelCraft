import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateStep {
  number: number;
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface EmptyStateProps {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  steps?: EmptyStateStep[];
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  steps,
  icon,
}: EmptyStateProps) {
  return (
    <div className="py-16 px-8 text-center max-w-2xl mx-auto">
      {icon && <div className="mb-6 opacity-20">{icon}</div>}

      <h3 className="text-xl font-serif text-foreground mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">{description}</p>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center justify-center gap-4 mb-12">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              className="rounded-none px-8 h-10 text-xs font-semibold uppercase tracking-widest"
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="rounded-none px-8 h-10 text-xs font-semibold uppercase tracking-widest"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {steps && steps.length > 0 && (
        <div className="border-t border-border/20 pt-8 space-y-6">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">
            Getting Started
          </p>
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex items-start gap-4 text-left bg-muted/5 p-4 rounded-sm border border-border/10"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {step.number}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">{step.title}</p>
                {step.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={step.action.onClick}
                    className="h-8 text-[10px] uppercase tracking-widest px-4"
                  >
                    {step.action.label}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
