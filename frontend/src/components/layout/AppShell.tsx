import { ReactNode, useState } from 'react';
import { AppHeader } from './AppHeader';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PageMargin, PaperSheet } from './PaperSheet';

interface AppShellProps {
  header?: ReactNode;
  leftNav?: ReactNode;
  leftContext?: ReactNode;
  rightPanel?: ReactNode;
  main: ReactNode;
  hideLeft?: boolean;
  hideRight?: boolean;
  title?: string;
}

export function AppShell({
  header,
  leftNav,
  leftContext,
  rightPanel,
  main,
  hideLeft = false,
  hideRight = false,
  title,
}: AppShellProps) {
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      {header || (
        <AppHeader
          title={title}
          onOpenLeft={() => setIsLeftOpen(true)}
          onOpenRight={() => setIsRightOpen(true)}
        />
      )}

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)]">
        {/* Desktop Left Sidebar */}
        {!hideLeft && (
          <aside className="hidden md:flex w-[300px] flex-col border-r border-border shrink-0">
            {leftNav || <LeftSidebar context={leftContext} />}
          </aside>
        )}

        {/* Mobile Left Drawer */}
        <Dialog open={isLeftOpen} onOpenChange={setIsLeftOpen}>
          <DialogContent className="fixed left-0 top-0 bottom-0 w-[280px] p-0 h-full translate-x-0 translate-y-0 rounded-none border-r border-border sm:rounded-none outline-none">
            <div className="h-full pt-14 bg-card">
               {leftNav || <LeftSidebar context={leftContext} />}
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background/50">
          <PageMargin>
            <PaperSheet className="flex-1">
              {main}
            </PaperSheet>
          </PageMargin>
        </main>

        {/* Desktop Right Sidebar */}
        {!hideRight && (
          <aside className="hidden lg:flex w-[400px] flex-col border-l border-border shrink-0">
            {rightPanel || <RightSidebar />}
          </aside>
        )}

        {/* Mobile Right Drawer */}
        <Dialog open={isRightOpen} onOpenChange={setIsRightOpen}>
          <DialogContent className="fixed right-0 top-0 bottom-0 w-[320px] p-0 h-full translate-x-0 translate-y-0 rounded-none border-l border-border sm:rounded-none left-auto outline-none">
             <div className="h-full pt-14 bg-card">
                {rightPanel || <RightSidebar />}
             </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
