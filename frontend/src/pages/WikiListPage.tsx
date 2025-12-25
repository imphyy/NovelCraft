import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { wikiAPI } from '../api/client';
import type { WikiPage, WikiPageType } from '../types/wiki';
import { WIKI_PAGE_TYPES } from '../types/wiki';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Library } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WikiListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<WikiPageType | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [pageType, setPageType] = useState<WikiPageType>('character');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPages();
  }, [projectId]);

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredPages(pages);
    } else {
      setFilteredPages(pages.filter(p => p.pageType === selectedType));
    }
  }, [selectedType, pages]);

  const loadPages = async () => {
    try {
      const response = await wikiAPI.list(projectId!);
      setPages(response.data);
    } catch (err) {
      console.error('Failed to load wiki pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await wikiAPI.create(projectId!, title, pageType);
      const newPage = response.data;
      setPages([newPage, ...pages]);
      setShowCreateModal(false);
      setTitle('');
      navigate(`/projects/${projectId}/wiki/${newPage.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create page');
    } finally {
      setCreating(false);
    }
  };

  const getTypeIcon = (type: WikiPageType) => {
    return WIKI_PAGE_TYPES.find(t => t.value === type)?.icon || '📄';
  };

  const getTypeCount = (type: WikiPageType) => {
    return pages.filter(p => p.pageType === type).length;
  };

  const leftContext = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Library className="h-3 w-3" />
          Wiki
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-xs text-primary hover:underline font-medium"
        >
          + New
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase mb-2 px-1">Filter by Type</h3>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedType('all')}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                selectedType === 'all'
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              All Pages ({pages.length})
            </button>
            {WIKI_PAGE_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between",
                  selectedType === type.value
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span>{type.label}</span>
                <span className="opacity-60">{getTypeCount(type.value)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading wiki...</div>
      </div>
    );
  }

  return (
    <AppShell
      title="Project Wiki"
      leftContext={leftContext}
      main={
        <div className="py-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold font-serif">Wiki</h2>
            <Button onClick={() => setShowCreateModal(true)}>
              New Page
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPages.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                No pages found. Create one to get started!
              </div>
            ) : (
              filteredPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => navigate(`/projects/${projectId}/wiki/${page.id}`)}
                  className="p-4 bg-card/50 border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-paperSm transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl" role="img" aria-label={page.pageType}>
                      {getTypeIcon(page.pageType)}
                    </span>
                    <span className="text-[10px] font-medium uppercase text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded">
                      {page.pageType}
                    </span>
                  </div>
                  <h3 className="font-bold group-hover:text-primary transition-colors mb-1 font-serif">
                    {page.title}
                  </h3>
                  {page.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {page.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-muted/50 text-muted-foreground px-1 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                      {page.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{page.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-xl shadow-paper max-w-md w-full p-8 border border-border">
                <h3 className="text-2xl font-bold mb-6 font-serif">New Wiki Page</h3>
                <form onSubmit={handleCreatePage} className="space-y-4">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {WIKI_PAGE_TYPES.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setPageType(type.value)}
                          className={cn(
                            "px-3 py-2 rounded-md text-xs font-medium border transition-colors",
                            pageType === type.value
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {type.icon} {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Creating...' : 'Create Page'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
