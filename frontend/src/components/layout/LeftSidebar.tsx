import type { ReactNode } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Book, Library, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeftSidebarProps {
  context?: ReactNode;
}

export function LeftSidebar({ context }: LeftSidebarProps) {
  const { projectId } = useParams<{ projectId: string }>();

  const navItems = [
    { name: 'Projects', icon: Home, href: '/projects' },
    ...(projectId ? [
      { name: 'Chapters', icon: Book, href: `/projects/${projectId}/editor` },
      { name: 'Wiki', icon: Library, href: `/projects/${projectId}/wiki` },
    ] : []),
  ];

  return (
    <aside className="flex flex-col h-full bg-muted/20 border-r border-border/10">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 font-sans",
                isActive
                  ? "bg-muted/40 text-foreground border-l-2 border-primary/50 pl-2.5 font-medium"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )
            }
          >
            <item.icon className={cn("h-4 w-4", "opacity-70")} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {context && (
        <div className="flex-1 overflow-y-auto border-t border-border/40 mt-2 p-4">
          <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.1em] mb-4 px-2">
            Context
          </div>
          {context}
        </div>
      )}
    </aside>
  );
}
