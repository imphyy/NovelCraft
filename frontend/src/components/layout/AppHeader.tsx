import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Sun, Moon, User, LogOut, PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/contexts/AuthContext';

interface AppHeaderProps {
  onOpenLeft?: () => void;
  onOpenRight?: () => void;
  title?: string;
}

export function AppHeader({ onOpenLeft, onOpenRight, title = "NovelCraft" }: AppHeaderProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

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
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground/60 hover:text-foreground"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <User className="h-4 w-4" />
          </Button>
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border/40 rounded-sm shadow-lg z-50">
                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground/60 hover:text-foreground" onClick={onOpenRight}>
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
