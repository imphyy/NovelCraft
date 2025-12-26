import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';

interface ListBlockProps {
  title: string;
  items: any[];
  renderItem: (item: any) => ReactNode;
  emptyState?: {
    title: string;
    description: string;
    primaryAction?: {
      label: string;
      onClick: () => void;
    };
  };
  viewAllLink?: {
    label: string;
    onClick: () => void;
  };
  maxItems?: number;
}

export function ListBlock({
  title,
  items,
  renderItem,
  emptyState,
  viewAllLink,
  maxItems = 5,
}: ListBlockProps) {
  const displayItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-serif text-foreground">{title}</h3>
        {viewAllLink && items.length > 0 && (
          <button
            onClick={viewAllLink.onClick}
            className="text-[10px] text-primary/60 hover:text-primary transition-colors uppercase tracking-widest font-semibold"
          >
            {viewAllLink.label}
          </button>
        )}
      </div>

      {items.length === 0 && emptyState ? (
        <div className="border border-dashed border-border/40 rounded-sm bg-muted/5">
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
            primaryAction={emptyState.primaryAction}
          />
        </div>
      ) : (
        <>
          <div className="space-y-0 border-t border-border/10">
            {displayItems.map((item, index) => (
              <div key={index} className="border-b border-border/5 last:border-b-0">
                {renderItem(item)}
              </div>
            ))}
          </div>
          {hasMore && (
            <p className="text-xs text-muted-foreground/50 italic text-center pt-2">
              + {items.length - maxItems} more
            </p>
          )}
        </>
      )}
    </div>
  );
}
