import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PaperSheetProps {
  children: ReactNode;
  className?: string;
  isContent?: boolean;
}

export function PaperSheet({ children, className, isContent = true }: PaperSheetProps) {
  return (
    <div 
      className={cn(
        "bg-card border border-border shadow-paper rounded-md p-6 md:p-10",
        isContent && "font-serif leading-relaxed text-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageMargin({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-4xl p-4 md:p-8 min-h-full flex flex-col", className)}>
      {children}
    </div>
  );
}
