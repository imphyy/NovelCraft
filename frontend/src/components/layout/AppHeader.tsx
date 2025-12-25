import { useNavigate, useParams } from 'react-router-dom';
import { Menu, Search, Sun, User, Settings, PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AppHeaderProps {
  onOpenLeft?: () => void;
  onOpenRight?: () => void;
  title?: string;
}

export function AppHeader({ onOpenLeft, onOpenRight, title = "NovelCraft" }: AppHeaderProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 flex items-center justify-between px-4 sticky top-0 z-40">
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
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Search chronicles..."
            className="w-full bg-background/40 border-border/50 pl-9 h-9 text-sm focus-visible:ring-ring/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Sun className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <User className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenRight}>
          <PanelRight className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
