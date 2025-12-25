import { ReactNode, useState } from 'react';

interface AppShellProps {
  header?: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  children: ReactNode;
  showLeftSidebar?: boolean;
  showRightSidebar?: boolean;
}

export function AppShell({
  header,
  leftSidebar,
  rightSidebar,
  children,
  showLeftSidebar = true,
  showRightSidebar = false,
}: AppShellProps) {
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Thin Header */}
      {header && (
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          {header}
        </header>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {showLeftSidebar && !isLeftCollapsed && (
          <aside className="w-80 border-r border-border bg-card/50 backdrop-blur-sm overflow-y-auto flex-shrink-0">
            {leftSidebar}
          </aside>
        )}

        {/* Left Sidebar Collapse Toggle */}
        {showLeftSidebar && (
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className="absolute left-0 top-20 z-10 p-2 bg-card border border-border rounded-r-lg shadow-paperSm hover:bg-muted transition-colors"
            aria-label={isLeftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isLeftCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        )}

        {/* Main Content (Paper Sheet) */}
        <main className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-4xl">
            {children}
          </div>
        </main>

        {/* Right Sidebar Collapse Toggle */}
        {showRightSidebar && (
          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className="absolute right-0 top-20 z-10 p-2 bg-card border border-border rounded-l-lg shadow-paperSm hover:bg-muted transition-colors"
            aria-label={isRightCollapsed ? 'Expand AI panel' : 'Collapse AI panel'}
          >
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isRightCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              )}
            </svg>
          </button>
        )}

        {/* Right Sidebar (AI Panel) */}
        {showRightSidebar && !isRightCollapsed && (
          <aside className="w-96 border-l border-border bg-card/50 backdrop-blur-sm overflow-y-auto flex-shrink-0">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
