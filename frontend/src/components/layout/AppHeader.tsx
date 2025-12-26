import { useNavigate, useParams } from 'react-router-dom';
import { Menu, Search, Sun, Moon, User, Settings, PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/components/theme-provider';

interface AppHeaderProps {
  onOpenLeft?: () => void;
  onOpenRight?: () => void;
  title?: string;
}

export function AppHeader({ onOpenLeft, onOpenRight, title = "NovelCraft" }: AppHeaderProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border/10 bg-muted/20 flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground" onClick={onOpenLeft}>
          <PanelLeft className="h-5 w-5" />
        </Button>
        <div 
          className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
          onClick={() => navigate('/projects')}
        >
          <div className="w-8 h-8 bg-primary/20 border border-primary/30 rounded flex items-center justify-center">
            <span className="text-primary text-xs font-bold font-serif">N</span>
          </div>
          <span className="hidden sm:block font-serif tracking-tight">{title}</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/40" />
          <input
            type="search"
            placeholder="Search chronicles..."
            className="w-full bg-muted/10 border border-border/40 pl-9 h-9 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-ring/30 placeholder:text-muted-foreground/40 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground/60 hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground/60 hover:text-foreground">
          <User className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground/60 hover:text-foreground" onClick={onOpenRight}>
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
